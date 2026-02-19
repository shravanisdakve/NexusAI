const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const StudyRoom = require('./models/StudyRoom');
const { analyzeChatContext } = require('./services/geminiService');
const { processModeration } = require('./services/moderatorService');

const roomActivity = new Map(); // Track messages per room for autonomous tips

const devAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:4173'
];

const socketHandler = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? (process.env.FRONTEND_URL || 'https://yourdomain.com')
                : devAllowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Community: Live Updates
        socket.on('join-community', () => socket.join('community-global'));

        socket.on('typing-community', (data) => {
            socket.to('community-global').emit('update-typing', data);
        });

        // Study Room: Join
        socket.on('join-room', async (roomId, user) => {
            try {
                const room = await StudyRoom.findById(roomId)
                    .populate('createdBy', 'displayName email')
                    .populate('participants.user', 'displayName email');

                if (!room || !room.active) {
                    socket.emit('room-error', { message: 'Room not found' });
                    return;
                }

                // Add user to participants if not already in
                if (user && user.id && mongoose.Types.ObjectId.isValid(user.id)) {
                    const existingParticipant = room.participants.find(
                        p => p.user && p.user._id && p.user._id.toString() === user.id
                    );

                    if (!existingParticipant) {
                        room.participants.push({ user: user.id });
                        await room.save();
                        // Re-populate after save
                        await room.populate('participants.user', 'displayName email');
                    }
                }

                socket.join(roomId);
                console.log(`User ${user?.displayName || socket.id} joined room: ${roomId}`);

                // Broadcast updated room to all clients in the room
                const roomData = {
                    id: room._id,
                    name: room.name,
                    courseId: room.courseId,
                    maxUsers: room.maxUsers,
                    users: room.participants.map(p => ({
                        id: p.user?._id?.toString() || '',
                        email: p.user?.email || '',
                        displayName: p.user?.displayName || 'Unknown'
                    })),
                    createdBy: room.createdBy?.displayName || 'Unknown',
                    createdById: room.createdBy?._id?.toString() || '',
                    createdByEmail: room.createdBy?.email || '',
                    mutedUserIds: (room.chatMutedUserIds || []).map((id) => id.toString()),
                    mutedUserEmails: room.participants
                        .filter((p) => p.user?._id && (room.chatMutedUserIds || []).some((id) => id.toString() === p.user._id.toString()))
                        .map((p) => p.user?.email || '')
                        .filter(Boolean),
                    technique: room.technique,
                    topic: room.topic,
                    techniqueState: room.techniqueState || null
                };

                io.to(roomId).emit('room-update', roomData);
            } catch (err) {
                console.error("Join room error:", err);
                socket.emit('room-error', { message: 'Error joining room' });
            }
        });

        // Typing Indicator
        socket.on('typing', (data) => {
            // data: { roomId, userName }
            socket.to(data.roomId).emit('user-typing', data);
        });

        socket.on('leave-room', (roomId) => {
            if (roomId) {
                socket.leave(roomId);
            }
        });

        // Chat Message Event
        socket.on('send-message', async (data) => {
            try {
                const senderId = data.userId ? String(data.userId) : '';
                const room = await StudyRoom.findById(data.roomId).select('chatMutedUserIds participants.user');
                const participantUserIds = new Set((room?.participants || [])
                    .map((participant) => participant.user?.toString())
                    .filter(Boolean));
                const mutedUserIds = new Set((room?.chatMutedUserIds || []).map((id) => id.toString()));

                if (senderId && !participantUserIds.has(senderId)) {
                    socket.emit('receive-message', {
                        id: `sys-membership-${Date.now()}`,
                        text: 'You are no longer a participant in this room.',
                        sender: 'System Moderator',
                        userId: 'system-moderator',
                        timestamp: new Date()
                    });
                    socket.leave(data.roomId);
                    return;
                }

                if (senderId && mutedUserIds.has(senderId)) {
                    socket.emit('receive-message', {
                        id: `sys-muted-${Date.now()}`,
                        text: 'You are muted by the host and cannot send chat messages right now.',
                        sender: 'System Moderator',
                        userId: 'system-moderator',
                        timestamp: new Date()
                    });
                    return;
                }

                const modResult = await processModeration(data.content);

                // Tier 1: Reflex
                if (modResult.flagged && modResult.tier === 1) {
                    socket.emit('receive-message', {
                        id: `sys-${Date.now()}`,
                        text: modResult.message,
                        sender: 'System Moderator',
                        userId: 'system-moderator',
                        timestamp: new Date()
                    });
                    return;
                }

                // Save and Broadcast
                const newMessage = new Message({
                    roomId: data.roomId,
                    userId: data.userId,
                    senderName: data.senderName,
                    content: data.content,
                    timestamp: new Date()
                });
                await newMessage.save();

                io.to(data.roomId).emit('receive-message', {
                    id: newMessage._id,
                    text: newMessage.content,
                    sender: newMessage.senderName,
                    userId: newMessage.userId,
                    email: data.email,
                    timestamp: newMessage.timestamp
                });

                // Tier 2: Vibe Check
                if (modResult.flagged && modResult.tier === 2) {
                    io.to(data.roomId).emit('receive-message', {
                        id: `mod-${Date.now()}`,
                        text: modResult.message,
                        sender: 'AI Moderator',
                        userId: 'system-moderator',
                        timestamp: new Date()
                    });
                }

                // --- AUTONOMOUS PROACTIVE MODERATION ---
                // Every 7 messages, analyze the vibe or help if needed
                const currentCount = (roomActivity.get(data.roomId) || 0) + 1;
                roomActivity.set(data.roomId, currentCount);

                if (currentCount >= 7 || modResult.tier === 3) {
                    roomActivity.set(data.roomId, 0); // Reset
                    setTimeout(async () => {
                        try {
                            const recentMessages = await Message.find({ roomId: data.roomId })
                                .sort({ timestamp: -1 })
                                .limit(10);
                            const intervention = await analyzeChatContext(recentMessages.reverse());
                            if (!intervention) {
                                return;
                            }

                            io.to(data.roomId).emit('receive-message', {
                                id: `mod-${Date.now()}`,
                                text: intervention,
                                sender: 'AI Moderator',
                                userId: 'system-moderator',
                                timestamp: new Date()
                            });
                        } catch (err) {
                            console.error("Autonomous AI Error:", err);
                        }
                    }, 2000);
                }

            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        // Threads/Posts Global Sync
        socket.on('new-thread', (thread) => {
            io.to('community-global').emit('update-threads', thread);
        });

        socket.on('new-post', (data) => {
            io.to('community-global').emit('update-posts', data);
        });

        socket.on('request-moderation', async ({ roomId }) => {
            try {
                if (!roomId) return;
                const recentMessages = await Message.find({ roomId })
                    .sort({ timestamp: -1 })
                    .limit(12);

                const intervention = await analyzeChatContext(recentMessages.reverse());
                if (!intervention) {
                    return;
                }

                io.to(roomId).emit('receive-message', {
                    id: `mod-manual-${Date.now()}`,
                    text: intervention,
                    sender: 'AI Moderator',
                    userId: 'system-moderator',
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('Manual moderation request failed:', error);
            }
        });

        // Whiteboard Draw Event
        socket.on('draw', (data) => {
            socket.to(data.roomId).emit('draw', data);
        });

        socket.on('clear-whiteboard', (roomId) => {
            socket.to(roomId).emit('clear-whiteboard');
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = socketHandler;
