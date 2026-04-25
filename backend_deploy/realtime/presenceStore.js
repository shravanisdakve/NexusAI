/**
 * Interface for Presence Stores. 
 * Can be implemented by MemoryPresenceStore or RedisPresenceStore.
 */
class PresenceStore {
  addPresence(roomId, user, socketId) {}
  removePresenceBySocket(socketId) {}
  heartbeat(roomId, userId) {}
  getPresence(roomId) {}
  performCleanup() {}
}

class MemoryPresenceStore extends PresenceStore {
  constructor() {
    super();
    this.roomPresence = new Map(); // roomId -> Map(userId -> { user, socketIds: Set, lastSeen })
    this.HEARTBEAT_TIMEOUT = 60000;

    // Bind methods to prevent 'this' context loss during destructuring
    this.addPresence = this.addPresence.bind(this);
    this.removePresenceBySocket = this.removePresenceBySocket.bind(this);
    this.heartbeat = this.heartbeat.bind(this);
    this.getPresence = this.getPresence.bind(this);
    this.performCleanup = this.performCleanup.bind(this);
  }

  addPresence(roomId, user, socketId) {
    if (!this.roomPresence.has(roomId)) {
      this.roomPresence.set(roomId, new Map());
    }
    
    const roomUsers = this.roomPresence.get(roomId);
    const userId = String(user.id || user._id);
    
    if (!roomUsers.has(userId)) {
      roomUsers.set(userId, {
        user: { id: userId, displayName: user.displayName, email: user.email },
        socketIds: new Set([socketId]),
        lastSeen: Date.now(),
      });
    } else {
      const entry = roomUsers.get(userId);
      entry.socketIds.add(socketId);
      entry.lastSeen = Date.now();
    }
  }

  removePresenceBySocket(socketId) {
    for (const [roomId, users] of this.roomPresence.entries()) {
      for (const [userId, entry] of users.entries()) {
        if (entry.socketIds.has(socketId)) {
          entry.socketIds.delete(socketId);
          if (entry.socketIds.size === 0) {
            users.delete(userId);
            if (users.size === 0) this.roomPresence.delete(roomId);
            return { roomId, userId, lastSocket: true };
          }
          return { roomId, userId, lastSocket: false };
        }
      }
    }
    return null;
  }

  heartbeat(roomId, userId) {
    const users = this.roomPresence.get(roomId);
    if (!users) return;
    const entry = users.get(String(userId));
    if (entry) entry.lastSeen = Date.now();
  }

  getPresence(roomId) {
    const users = this.roomPresence.get(roomId);
    if (!users) return [];
    return Array.from(users.values()).map(x => x.user);
  }

  performCleanup() {
    const now = Date.now();
    const roomsToUpdate = new Set();
    for (const [roomId, users] of this.roomPresence.entries()) {
      for (const [userId, entry] of users.entries()) {
        if (now - entry.lastSeen > this.HEARTBEAT_TIMEOUT) {
          users.delete(userId);
          roomsToUpdate.add(roomId);
        }
      }
      if (users.size === 0) this.roomPresence.delete(roomId);
    }
    return Array.from(roomsToUpdate);
  }
}

// Export singleton
module.exports = new MemoryPresenceStore();
