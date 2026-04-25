const StudyRoom = require('../models/StudyRoom');

const whiteboards = new Map(); // roomId -> { strokes: [], dirty: boolean, lastActivity: number }
const MAX_STROKES_IN_MEMORY = 3000;

/**
 * Appends a stroke to the in-memory board buffer.
 */
function appendStroke(roomId, stroke) {
  if (!whiteboards.has(roomId)) {
    whiteboards.set(roomId, { strokes: [], dirty: true, lastActivity: Date.now() });
  }
  
  const board = whiteboards.get(roomId);
  board.strokes.push(stroke);
  board.dirty = true;
  board.lastActivity = Date.now();

  if (board.strokes.length > MAX_STROKES_IN_MEMORY) {
    board.strokes.shift(); // Keep memory footprint safe
  }
}

/**
 * Returns current strokes for a room.
 * If not in memory, it will attempt to return an empty array initially 
 * (actual rehydration is handled by rehydrateFromDb).
 */
function getWhiteboard(roomId) {
  return whiteboards.get(roomId)?.strokes || [];
}

/**
 * Clears the whiteboard both in memory and (optionally) prepared for next DB sync.
 */
function clearWhiteboard(roomId) {
  whiteboards.set(roomId, { strokes: [], dirty: true, lastActivity: Date.now() });
}

/**
 * Load snapshot from MongoDB into memory.
 * Call this when a room is first accessed or the server restarts.
 */
async function rehydrateFromDb(roomId) {
  if (whiteboards.has(roomId)) return; // Already in memory

  try {
    const room = await StudyRoom.findById(roomId).select('whiteboardSnapshot');
    if (room && room.whiteboardSnapshot) {
      whiteboards.set(roomId, { 
        strokes: room.whiteboardSnapshot, 
        dirty: false, 
        lastActivity: Date.now() 
      });
      console.log(`[Whiteboard] Rehydrated ${room.whiteboardSnapshot.length} strokes for room ${roomId}`);
    }
  } catch (err) {
    console.error(`[Whiteboard] Error rehydrating room ${roomId}:`, err);
  }
}

/**
 * Persists all "dirty" whiteboards to MongoDB.
 */
async function persistSnapshots() {
  const dirtyRooms = Array.from(whiteboards.entries())
    .filter(([_, data]) => data.dirty);

  for (const [roomId, data] of dirtyRooms) {
    try {
      await StudyRoom.findByIdAndUpdate(roomId, {
        whiteboardSnapshot: data.strokes
      });
      data.dirty = false;
      console.log(`[Whiteboard] Snapshot saved for room ${roomId}`);
    } catch (err) {
      console.error(`[Whiteboard] Failed to save snapshot for ${roomId}:`, err);
    }
  }
}

/**
 * Cleanup inactive rooms from memory after 1 hour of zero activity.
 */
function cleanupInactiveBoards() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [roomId, data] of whiteboards.entries()) {
    if (data.lastActivity < oneHourAgo && !data.dirty) {
      whiteboards.delete(roomId);
      console.log(`[Whiteboard] Memory cleanup: room ${roomId}`);
    }
  }
}

module.exports = { 
  appendStroke, 
  getWhiteboard, 
  clearWhiteboard, 
  rehydrateFromDb, 
  persistSnapshots,
  cleanupInactiveBoards
};
