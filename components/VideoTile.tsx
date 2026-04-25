import React, { useEffect, useRef } from 'react';
import { MicOff, User, ScreenShare } from 'lucide-react';

interface VideoTileProps {
    stream?: MediaStream | null;
    displayName: string;
    isMuted: boolean;
    isLocal?: boolean;
    isScreenSharing?: boolean;
    className?: string;
    isSyncing?: boolean; // New prop to indicate if stream is actually broadcasting
}

const VideoTile: React.FC<VideoTileProps> = ({ stream, displayName, isMuted, isLocal = false, isScreenSharing = false, isSyncing = false, className = '' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`relative bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center ring-2 ring-transparent has-[:focus-visible]:ring-violet-500 ${!className.includes('aspect-') ? 'aspect-video' : ''} ${className}`}>
            {stream && (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal}
                        className={`w-full h-full object-contain ${isLocal && !isScreenSharing ? 'transform scale-x-[-1]' : ''} ${!stream.getVideoTracks()[0]?.enabled ? 'hidden' : ''}`}
                    />
                    {!stream.getVideoTracks()[0]?.enabled && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                            <User size={64} />
                        </div>
                    )}
                </>
            )}
            {!stream && (
                <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <User size={32} className="opacity-40" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Stream Hidden</span>
                </div>
            )}

            {isLocal && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 bg-violet-600/90 rounded-md ring-1 ring-white/10 shadow-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">Local Preview</span>
                </div>
            )}

            {!isSyncing && isLocal && (
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-slate-900/80 rounded-md border border-white/5">
                    <span className="text-[8px] font-medium text-slate-400">Not Broadcasting</span>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {isMuted && <MicOff size={16} className="text-white bg-red-600/80 p-0.5 rounded-full" />}
                    <span className="text-sm font-medium text-white drop-shadow-md">{displayName}</span>
                </div>
                {isScreenSharing && (
                    <div className="flex items-center gap-1 text-xs text-sky-300 bg-sky-900/50 px-2 py-1 rounded-md">
                        <ScreenShare size={14} />
                        <span>Presenting</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoTile;
