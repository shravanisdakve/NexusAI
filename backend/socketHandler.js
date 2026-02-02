const socketIo = require('socket.io');

const socketHandler = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? (process.env.FRONTEND_URL || 'https://yourdomain.com')
                : 'http://localhost:3000',
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
        socket.on('request-moderation', (data) => {
            // data contains: { roomId, context }
            // This could trigger an AI call later
            io.to(data.roomId).emit('moderator-notified', { message: 'AI Moderator is analyzing the session...' });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = socketHandler;
