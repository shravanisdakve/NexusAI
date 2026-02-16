const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const StudyRoom = require('./models/StudyRoom');
const { analyzeChatContext } = require('./services/geminiService');
const { processModeration } = require('./services/moderatorService');

const roomActivity = new Map(); // Track messages per room for autonomous tips

const socketHandler = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? (process.env.FRONTEND_URL || 'https://yourdomain.com')
                : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
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
                    .populate('createdBy', 'displayName')
                    .populate('participants.user', 'displayName email');

                if (!room) {
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
                        email: p.user?.email || '',
                        displayName: p.user?.displayName || 'Unknown'
                    })),
                    createdBy: room.createdBy?.displayName || 'Unknown',
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
