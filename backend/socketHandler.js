const socketIo = require('socket.io');
const Message = require('./models/Message');
const { analyzeChatContext } = require('./services/geminiService');

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

        // Join Study Room
        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
        });

        // Chat Message Event
        socket.on('send-message', async (data) => {
            // data: { roomId, userId, senderName, content }
            try {
                // Save to MongoDB
                const newMessage = new Message({
                    roomId: data.roomId,
                    userId: data.userId,
                    senderName: data.senderName,
                    content: data.content,
                    timestamp: new Date()
                });
                await newMessage.save();

                // Broadcast to room (including sender, or exclude sender depending on UI logic)
                io.to(data.roomId).emit('receive-message', {
                    id: newMessage._id,
                    text: newMessage.content,
                    sender: newMessage.senderName,
                    userId: newMessage.userId,
                    email: data.email,
                    timestamp: newMessage.timestamp
                });
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        // Whiteboard Draw Event
        socket.on('draw', (data) => {
            // data contains: { roomId, x0, y0, x1, y1, color, width }
            socket.to(data.roomId).emit('draw', data);
        });

        // Whiteboard Clear Event
        socket.on('clear-whiteboard', (roomId) => {
            socket.to(roomId).emit('clear-whiteboard');
        });

        // AI Moderation Trigger
        socket.on('request-moderation', async (data) => {
            // data: { roomId } (context not strictly needed if we fetch from DB)
            const { roomId } = data;

            // Notify room that AI is thinking
            io.to(roomId).emit('moderator-notified', { message: 'AI Moderator is analyzing the session...' });

            try {
                // Fetch last 50 messages
                const recentMessages = await Message.find({ roomId })
                    .sort({ timestamp: -1 })
                    .limit(50);

                // Chronological order for AI
                const messagesForAI = recentMessages.reverse();

                if (messagesForAI.length === 0) {
                    io.to(roomId).emit('receive-message', {
                        id: `mod-${Date.now()}`,
                        text: "I'm here to help, but I don't see any messages yet! Start studying and I'll jump in.",
                        sender: 'AI Moderator',
                        userId: 'system-moderator',
                        timestamp: new Date()
                    });
                    return;
                }

                // Analyze with Gemini
                const intervention = await analyzeChatContext(messagesForAI);

                // Send AI Response back to room
                io.to(roomId).emit('receive-message', {
                    id: `mod-${Date.now()}`,
                    text: intervention,
                    sender: 'AI Moderator',
                    userId: 'system-moderator',
                    timestamp: new Date()
                });

            } catch (error) {
                console.error("Moderation Error:", error);
                io.to(roomId).emit('receive-message', {
                    id: `mod-${Date.now()}`,
                    text: "I'm having a brief connection issue, but please continue studying!",
                    sender: 'AI Moderator',
                    userId: 'system-moderator',
                    timestamp: new Date()
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = socketHandler;
