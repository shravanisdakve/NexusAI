import React from 'react';
import { Modal, Button } from './ui';
import { User, Users, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addRoom } from '../services/communityService';
import { useAuth } from '../contexts/AuthContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const handleCreateRoom = async (mode: 'Solo' | 'Group' | 'College') => {
        if (!currentUser?.email) {
            // Handle not logged in case
            return;
        }

        let roomName = `${currentUser.displayName}'s Study Room`;
        let maxUsers = 1;

        if (mode === 'Group') {
            maxUsers = 5;
        } else if (mode === 'College') {
            // College mode logic can be expanded here
            maxUsers = 5;
        }


        const newRoom = await addRoom(roomName, 'general', maxUsers, currentUser.email, currentUser.university);
        if (newRoom) {
            navigate(`/study-room/${newRoom.id}`);
        }
        onClose();
    };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a New Study Room">
      <div className="space-y-4">
        <p className="text-sm text-slate-400 text-center">Choose a mode that best fits your study session.</p>

        <Button onClick={() => handleCreateRoom('Solo')} className="w-full flex justify-start items-center p-4 h-auto bg-slate-700 hover:bg-slate-600">
            <User className="w-5 h-5 mr-4 text-violet-400" />
            <div>
                <p className="font-semibold text-left">Solo Mode</p>
                <p className="font-normal text-xs text-slate-400 text-left">Focused, distraction-free</p>
            </div>
        </Button>

        <Button onClick={() => handleCreateRoom('Group')} className="w-full flex justify-start items-center p-4 h-auto bg-slate-700 hover:bg-slate-600">
           <Users className="w-5 h-5 mr-4 text-sky-400" />
            <div>
                <p className="font-semibold text-left">Group Mode</p>
                <p className="font-normal text-xs text-slate-400 text-left">Collaborate with up to 5 friends</p>
            </div>
        </Button>

        <Button onClick={() => handleCreateRoom('College')} className="w-full flex justify-start items-center p-4 h-auto bg-slate-700 hover:bg-slate-600">
            <Briefcase className="w-5 h-5 mr-4 text-amber-400" />
            <div>
                <p className="font-semibold text-left">College Mode</p>
                <p className="font-normal text-xs text-slate-400 text-left">Connect with others from the same course/university</p>
            </div>
        </Button>
      </div>
    </Modal>
  );
};

export default CreateRoomModal;