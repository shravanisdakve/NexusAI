const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const StudyRoom = require('./models/StudyRoom');
const { analyzeChatContext, analyzeKnowledgeGaps } = require('./services/geminiService');

const presenceStore = require("./realtime/presenceStore");
const whiteboardStore = require("./realtime/whiteboardStore");

const allowedOrigins = [
    'https://nexusai-e068c.web.app',
    'https://nexusai-e068c.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:4173'
];

function normalizeTechniqueState(state) {
  if (!state?.phaseEndsAt) return state;

  const remaining = Math.floor((new Date(state.phaseEndsAt).getTime() - Date.now()) / 1000);

  // Auto-pause if time is up, but don't advance automatically here (let REST handle state changes)
  if (state.isRunning && remaining <= 0) {
    return {
      ...state,
      isRunning: false,
      remainingSec: 0,
      version: (state.version || 1),
    };
  }

  return {
    ...state,
    remainingSec: Math.max(remaining, 0),
  };
}

const socketHandler = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                if (allowedOrigins.indexOf(origin) === -1) {
                    return callback(new Error('CORS blocked'), false);
                }
                return callback(null, true);
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Periodic cleanup of stale connections (every 45s)
    setInterval(() => {
        const roomsToUpdate = presenceStore.performCleanup();
        roomsToUpdate.forEach(roomId => {
            io.to(roomId).emit('presence:update', presenceStore.getPresence(roomId));
        });
    }, 45000);

    // Periodic whiteboard state persistence (every 20s)
    setInterval(() => {
        whiteboardStore.persistSnapshots();
        whiteboardStore.cleanupInactiveBoards();
    }, 20000);

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join-room', async (roomId, user) => {
            try {
                if (!roomId || !user) return;

                // R-01 FIX: Verify JWT identity — prevent userId spoofing
                const token = socket.handshake.auth?.token;
                if (!token) {
                    return socket.emit('room:error', { message: 'Authentication required to join a room.' });
                }
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const tokenUserId = String(decoded.userId || decoded.id);
                    const claimedUserId = String(user.id || user._id);
                    if (tokenUserId !== claimedUserId) {
                        console.warn(`[Socket] Identity mismatch! Token: ${tokenUserId}, Claimed: ${claimedUserId}`);
                        return socket.emit('room:error', { message: 'Identity verification failed.' });
                    }
                } catch (tokenErr) {
                    return socket.emit('room:error', { message: 'Invalid or expired authentication token.' });
                }
                
                socket.data.roomId = roomId;
                socket.data.userId = String(user.id || user._id);
                socket.data.user = user;

                socket.join(roomId);
                presenceStore.addPresence(roomId, user, socket.id);
                
                // Ensure whiteboard data is loaded from DB if not already in memory
                await whiteboardStore.rehydrateFromDb(roomId);

                const room = await StudyRoom.findById(roomId).lean();
                if (!room) {
                    return socket.emit('room:error', { message: 'Room not found' });
                }

                // Initial hydration for the client
                socket.emit('room:state', {
                    roomId,
                    notes: room.sharedNotes || "",
                    notesVersion: room.notesVersion || 1,
                    techniqueState: normalizeTechniqueState(room.techniqueState),
                    whiteboard: whiteboardStore.getWhiteboard(roomId),
                    presence: presenceStore.getPresence(roomId),
                });

                // Update everyone else's user list
                io.to(roomId).emit('presence:update', presenceStore.getPresence(roomId));
                
                console.log(`User ${user.displayName} joined room: ${roomId}`);
            } catch (err) {
                console.error("Join room error:", err);
                socket.emit('room:error', { message: 'Error joining room' });
            }
        });

        socket.on('presence:heartbeat', ({ roomId, userId }) => {
            presenceStore.heartbeat(roomId, userId);
        });

        socket.on('typing', (data) => {
            if (data.roomId) {
                socket.to(data.roomId).emit('user-typing', data);
            }
        });

        socket.on('send-message', async (data) => {
            try {
                const { roomId, content, senderName, userId, email } = data;
                
                const newMessage = new Message({
                    roomId,
                    userId,
                    senderName,
                    content,
                    timestamp: new Date()
                });
                await newMessage.save();

                io.to(roomId).emit('receive-message', {
                    id: newMessage._id,
                    text: newMessage.content,
                    sender: newMessage.senderName,
                    userId: newMessage.userId,
                    email: email,
                    timestamp: newMessage.timestamp
                });
            } catch (error) {
                console.error("Error saving message:", error);
            }
        });

        // Whiteboard Draw Event
        socket.on('draw', (data) => {
            if (data.roomId && data.stroke) {
                whiteboardStore.appendStroke(data.roomId, data.stroke);
                socket.to(data.roomId).emit('draw', data);
            }
        });

        socket.on('whiteboard:clear', (roomId) => {
            if (roomId) {
                whiteboardStore.clearWhiteboard(roomId);
                io.to(roomId).emit('whiteboard:cleared');
            }
        });

        socket.on('room:state:request', async ({ roomId }) => {
            try {
                const room = await StudyRoom.findById(roomId).lean();
                if (!room) return;

                socket.emit('room:state', {
                    roomId,
                    notes: room.sharedNotes || "",
                    notesVersion: room.notesVersion || 1,
                    techniqueState: normalizeTechniqueState(room.techniqueState),
                    whiteboard: whiteboardStore.getWhiteboard(roomId),
                    presence: presenceStore.getPresence(roomId),
                });
            } catch (err) {
                console.error("State request error:", err);
            }
        });

        socket.on('disconnect', () => {
            const removed = presenceStore.removePresenceBySocket(socket.id);
            // Only broadcast if the user is truly gone from the room (last tab closed)
            if (removed?.roomId && removed.lastSocket) {
                io.to(removed.roomId).emit('presence:update', presenceStore.getPresence(removed.roomId));
            }
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = socketHandler;
