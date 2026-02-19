import React from 'react';
import { Button } from './ui';
import { Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, PhoneOff, Smile, Music, Share2, Clock, Palette } from 'lucide-react';


interface RoomControlsProps {
  mediaReady: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onHangUp: () => void;
  onReact: (emoji: string) => void;
  onToggleMusic: () => void;
  onShare: () => void;
  roomId: string;
  formattedSessionTime: string;
  showMusicPlayer: boolean; // NEW: Prop to control MusicPlayer visibility
  showWhiteboard: boolean; // NEW: Prop to control Whiteboard visibility
  children?: React.ReactNode; // NEW: To render the MusicPlayer as a child
  onToggleWhiteboard: () => void; // NEW: Callback to toggle whiteboard
}

const EMOJIS = ['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F389}', '\u{1F914}', '\u{1F64F}'];

const RoomControls: React.FC<RoomControlsProps> = ({
  mediaReady,
  isMuted,
  isCameraOn,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onHangUp,
  onReact,
  onToggleMusic,
  onShare,
  roomId,
  formattedSessionTime,
  showMusicPlayer, // Destructure new prop
  showWhiteboard, // Destructure new prop
  onToggleWhiteboard, // Destructure new prop
  children // Destructure new prop
}) => {
  const [showReactions, setShowReactions] = React.useState(false);
  const roomCode = roomId ? roomId.slice(-6).toUpperCase() : '';

  const baseControlButton = 'p-2.5 rounded-full border border-white/10 bg-slate-800/80 hover:bg-slate-700/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="bg-slate-950/85 backdrop-blur-xl px-2 sm:px-4 py-2 border-t border-white/10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button
            onClick={onToggleMute}
            disabled={!mediaReady}
            className={`${baseControlButton} ${isMuted ? 'bg-red-600 hover:bg-red-700 border-red-500/60' : ''}`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>

          <Button
            onClick={onToggleCamera}
            disabled={!mediaReady || isScreenSharing}
            className={`${baseControlButton} ${!isCameraOn || isScreenSharing ? 'bg-red-600 hover:bg-red-700 border-red-500/60' : ''}`}
            aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn && !isScreenSharing ? <Video size={18} /> : <VideoOff size={18} />}
          </Button>

          <Button
            onClick={onToggleScreenShare}
            disabled={!mediaReady && !isScreenSharing}
            className={`${baseControlButton} ${isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500/70' : ''}`}
            aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          >
            {isScreenSharing ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
          </Button>

          <Button
            onClick={onToggleWhiteboard}
            className={`${baseControlButton} ${showWhiteboard ? 'bg-violet-600 hover:bg-violet-700 border-violet-500/70' : ''}`}
            aria-label="Toggle whiteboard"
            title="Toggle whiteboard"
          >
            <Palette size={18} />
          </Button>

          <div className="relative">
            <Button
              onClick={() => setShowReactions(prev => !prev)}
              className={baseControlButton}
              aria-label="React"
              title="React"
            >
              <Smile size={18} />
            </Button>
            {showReactions && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 p-2 rounded-lg shadow-lg flex gap-1.5 z-30">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      setShowReactions(false);
                    }}
                    className="text-xl p-1 hover:bg-slate-700 rounded transition-transform duration-100 hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              onClick={onToggleMusic}
              className={`${baseControlButton} ${showMusicPlayer ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500/70' : ''}`}
              aria-label="Toggle music player"
              title="Toggle music player"
            >
              <Music size={18} />
            </Button>
            {children}
          </div>

          <Button
            onClick={onShare}
            className={baseControlButton}
            aria-label="Share room"
            title="Share room"
          >
            <Share2 size={18} />
          </Button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest">
            <span>Room</span>
            <span className="font-mono text-slate-400">{roomCode || '--'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-slate-300 bg-slate-800/70 border border-slate-700/60 px-3 py-1 rounded-full">
            <Clock size={14} className="text-violet-400" />
            <span>{formattedSessionTime}</span>
          </div>
          <Button
            onClick={onHangUp}
            className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-2"
            aria-label="Leave room"
          >
            <PhoneOff size={18} className="mr-1.5" />
            <span className="hidden sm:inline">Leave Room</span>
            <span className="sm:hidden">Leave</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoomControls;
