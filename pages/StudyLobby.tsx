import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Input } from '../components/ui';
import { addRoom } from '../services/communityService';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, PlusCircle, Users } from 'lucide-react';

const StudyLobby: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [joinId, setJoinId] = useState('');
    const [error, setError] = useState('');

    const handleCreateRoom = async () => {
        if (!currentUser?.email) {
            setError('You must be logged in to create a room.');
            return;
        }
        // For simplicity, creating a room doesn't require course selection here.
        // It's named after the user. A more complex flow could use a modal.
        const roomName = `${currentUser.displayName}'s Study Room`;
        const newRoom = await addRoom(roomName, 'general', 5, currentUser.email, currentUser.university);
        if (newRoom) {
            navigate(`/study-room/${newRoom.id}`);
        }
    };

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinId.trim()) {
            // A real app would validate the room ID here.
            // We navigate optimistically. The StudyRoom page will handle invalid IDs.
            navigate(`/study-room/${joinId.trim()}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-2xl text-center">
                <Users size={48} className="mx-auto text-violet-400 mb-4" />
                <PageHeader title="Study Room" subtitle="Collaborate with friends in a real-time video room with a shared AI assistant." />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                    {/* Create Room Card */}
                    <div className="bg-slate-800/50 p-8 rounded-xl ring-1 ring-slate-700 flex flex-col items-center text-center">
                        <h3 className="text-2xl font-bold text-white mb-3">Create a New Room</h3>
                        <p className="text-slate-400 mb-6 flex-1">Start a private session and invite your friends to join you.</p>
                        <Button onClick={handleCreateRoom} className="w-full text-lg py-3">
                            <PlusCircle size={20} className="mr-2" /> Create Room
                        </Button>
                    </div>

                    {/* Join Room Card */}
                    <div className="bg-slate-800/50 p-8 rounded-xl ring-1 ring-slate-700 flex flex-col items-center text-center">
                        <h3 className="text-2xl font-bold text-white mb-3">Join a Room</h3>
                        <p className="text-slate-400 mb-6 flex-1">Enter the ID of an existing room to join the study session.</p>
                        <form onSubmit={handleJoinRoom} className="w-full flex gap-2">
                            <Input
                                type="text"
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                placeholder="Enter Room ID"
                                className="text-center"
                            />
                            <Button type="submit" className="px-4">
                                <ArrowRight size={20} />
                            </Button>
                        </form>
                    </div>
                </div>

                {error && <p className="text-red-400 mt-6">{error}</p>}
                
                 <div className="mt-12 p-4 bg-slate-800 rounded-lg">
                    <h4 className="font-semibold text-slate-200">How to use:</h4>
                    <ul className="text-sm text-slate-400 list-disc list-inside mt-2 text-left space-y-1">
                        <li>Click "Create Room" to generate a new room and automatically join it.</li>
                        <li>Use the "Copy ID" button inside the room to share the link with friends.</li>
                        <li>Your friends can paste the ID on this page to join your session.</li>
                        <li>Use the integrated AI to look up concepts or quiz yourselves as a group!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudyLobby;