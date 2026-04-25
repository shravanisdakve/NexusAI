import { useState, useCallback, useRef, useEffect } from 'react';

export const useMediaStream = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const getMedia = useCallback(async () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            
            // Production default: Privacy first
            stream.getAudioTracks().forEach(track => track.enabled = false);
            stream.getVideoTracks().forEach(track => track.enabled = false);
            
            setLocalStream(stream);
            setMediaError(null);
            setIsMuted(true);
            setIsCameraOn(false);
        } catch (err: any) {
            console.error("Media access error:", err);
            setMediaError({ 
                message: "Could not access media. Video features disabled.", 
                type: 'error' 
            });
            setLocalStream(null);
        }
    }, []);

    useEffect(() => {
        getMedia();
        return () => {
            localStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [getMedia]);

    const toggleMute = useCallback(() => {
        localStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled);
        setIsMuted(prev => !prev);
    }, [localStream]);

    const toggleCamera = useCallback(() => {
        if (isScreenSharing) return;
        localStream?.getVideoTracks().forEach(t => t.enabled = !t.enabled);
        setIsCameraOn(prev => !prev);
    }, [localStream, isScreenSharing]);

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            localStream?.getVideoTracks().forEach(t => { if(t.label.startsWith('screen')) t.stop(); });
            await getMedia();
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                if (localStreamRef.current) {
                    const original = localStreamRef.current.getVideoTracks()[0];
                    if (original) localStreamRef.current.removeTrack(original);
                    localStreamRef.current.addTrack(screenTrack);
                }
                setIsScreenSharing(true);
            } catch (err) { console.error(err); }
        }
    }, [isScreenSharing, localStream, getMedia]);

    return {
        localStream, isMuted, isCameraOn, isScreenSharing, mediaError,
        toggleMute, toggleCamera, toggleScreenShare
    };
};
