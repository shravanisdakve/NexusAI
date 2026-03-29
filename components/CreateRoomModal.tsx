import React, { useState, useEffect } from 'react';
// --- FIX: Import Select component and Course type ---
import { Modal, Button, Input, Select } from './ui';
import { type Course } from '../types'; // Import Course type
// --- END FIX ---
import { User, Users, Briefcase, ArrowLeft, MessageSquare, Brain, Timer, Target, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { addRoom } from '../services/communityService';
// --- FIX: Import getCourses service ---
import { getCourses } from '../services/courseService';
// --- END FIX ---
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';


interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalStep = 'selectMode' | 'selectTechnique' | 'configureRoom';
type RoomMode = 'Group' | 'College';

const techniques = [
    { 
        name: 'Pomodoro Technique', 
        meaning: 'A time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.',
        use: 'Enter "Focus Mode" for 25 minutes, then "Break Mode" for 5. Great for maintaining high concentration levels without burnout.',
        icon: Timer 
    },
    { 
        name: 'Feynman Technique', 
        meaning: 'A learning method where you explain a concept in simple terms, identifying gaps in your understanding to focus your study.',
        use: 'Try to explain your topic to the AI Buddy in "Simple Mode". If you can\'t explain it simply, you don\'t understand it well enough.',
        icon: MessageSquare 
    },
    { 
        name: 'Spaced Repetition', 
        meaning: 'An evidence-based learning technique that performs review of material at increasing intervals to leverage the spacing effect.',
        use: 'Generate key points from your notes and schedule them for review. Ideal for long-term retention of large amounts of info.',
        icon: Brain 
    }
];

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [modalStep, setModalStep] = useState<ModalStep>('selectMode');
    const [selectedMode, setSelectedMode] = useState<RoomMode | null>(null);
    const [userLimit, setUserLimit] = useState(5);
    const [selectedTechnique, setSelectedTechnique] = useState(techniques[0].name);
    const [topic, setTopic] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    // --- FIX: Add state for courses and selected courseId ---
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseId, setCourseId] = useState<string | null>(null); // Use null for "General" option
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);
    // --- END FIX ---


    useEffect(() => {
        if (selectedMode === 'College') {
            setUserLimit(10);
        } else {
            setUserLimit(5);
        }
    }, [selectedMode]);

    // --- FIX: Fetch courses when modal opens or college mode is selected ---
    useEffect(() => {
        const fetchCourses = async () => {
            setIsLoadingCourses(true);
            try {
                const fetchedCourses = await getCourses();
                setCourses(fetchedCourses);
            } catch (error) {
                console.error("Failed to fetch courses for modal:", error);
            } finally {
                setIsLoadingCourses(false);
            }
        };

        // Fetch courses if the modal is open, needed for the dropdown
        if (isOpen) {
            fetchCourses();
        }

    }, [isOpen]); // Re-fetch if modal re-opens
    // --- END FIX ---

    const handleModeSelect = (mode: RoomMode) => {
        setSelectedMode(mode);
        setModalStep('selectTechnique');
    };

    const handleTechniqueSelect = () => {
        setModalStep('configureRoom');
    };

    const { showToast } = useToast();
    const handleCreateRoom = async () => {
        setIsCreatingRoom(true);

        let finalCourseId: string;
        if (selectedMode === 'College') {
            if (!courseId) {
                alert("Please select a course for College Mode, or choose 'General / University Wide'.");
                setIsCreatingRoom(false);
                return;
            }
            finalCourseId = courseId;
        } else {
            finalCourseId = 'general';
        }

        const safeName = user.displayName || 'Guest';
        const roomName = `${safeName}'s ${selectedMode} Room${topic ? ` (${topic})` : ''}`;

        try {
            // The new addRoom function expects an object for the creator
            const createdBy = { email: user.email, displayName: user.displayName };

            const newRoom = await addRoom(roomName, finalCourseId, userLimit, createdBy, user.university, selectedTechnique, topic);

            if (newRoom) {
                console.log("Room created successfully, navigating to:", newRoom.id);
                navigate(`/study-room/${newRoom.id}`);
            }
        } catch (error) {
            console.error("Failed to create room in Modal:", error);
            alert(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsCreatingRoom(false);
            handleClose();
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setModalStep('selectMode');
            setSelectedMode(null);
            setUserLimit(5);
            setSelectedTechnique(techniques[0].name);
            setTopic('');
            setIsCreatingRoom(false);
            setCourseId(null); // Reset course selection
            setCourses([]); // Clear courses list
            setIsLoadingCourses(false);
        }, 300);
    };

    // ... (renderSelectMode and renderSelectTechnique remain the same) ...
    const renderSelectMode = () => (
        <div className="space-y-4">
            <p className="text-sm text-slate-400 text-center">Choose a mode that best fits your study session.</p>

            <Button onClick={() => handleModeSelect('Group')} className="w-full flex justify-start items-center p-4 h-auto bg-slate-700 hover:bg-slate-600">
                <Users className="w-5 h-5 mr-4 text-sky-400" />
                <div>
                    <p className="font-semibold text-left">Group Study</p>
                    <p className="font-normal text-xs text-slate-400 text-left">Collaborate with a small, private group (2-5 friends)</p>
                </div>
            </Button>

            <Button onClick={() => handleModeSelect('College')} className="w-full flex justify-start items-center p-4 h-auto bg-slate-700 hover:bg-slate-600">
                <Building className="w-5 h-5 mr-4 text-amber-400" /> {/* Changed Icon */}
                <div>
                    <p className="font-semibold text-left">College / Course Room</p>
                    <p className="font-normal text-xs text-slate-400 text-left">Join or create a larger room based on your course (up to 60)</p>
                </div>
            </Button>
        </div>
    );

    const renderSelectTechnique = () => (
        <div className="space-y-4">
            <button onClick={() => setModalStep('selectMode')} className="flex items-center text-sm text-slate-400 hover:text-white">
                <ArrowLeft size={16} className="mr-1" /> Back to modes
            </button>
            <div className="text-center">
                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2"><Target /> Targeted Learning ({selectedMode})</h3>
                <p className="text-sm text-slate-400">Optionally choose a technique and topic to focus your session.</p>
            </div>

            <div className="space-y-2">
                {techniques.map(tech => (
                    <button
                        key={tech.name}
                        onClick={() => setSelectedTechnique(tech.name)}
                        className={`group w-full p-3 rounded-lg text-left transition-all duration-300 ring-2 ${
                            selectedTechnique === tech.name 
                                ? 'bg-slate-700 ring-violet-500 shadow-lg shadow-violet-500/10' 
                                : 'bg-slate-800 ring-transparent hover:ring-slate-700 hover:bg-slate-700/50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <tech.icon className={`w-4 h-4 ${selectedTechnique === tech.name ? 'text-violet-400' : 'text-slate-400 group-hover:text-violet-400'} transition-colors`} />
                            <h4 className={`font-semibold text-sm ${selectedTechnique === tech.name ? 'text-white' : 'text-slate-200 group-hover:text-white'} transition-colors`}>
                                {tech.name}
                            </h4>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            selectedTechnique === tech.name 
                                ? 'max-h-64 opacity-100 mt-3' 
                                : 'max-h-0 opacity-0 group-hover:max-h-64 group-hover:opacity-100 group-hover:mt-3'
                        }`}>
                            <div className="pl-6 border-l-2 border-violet-500/30 space-y-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">MEANING</p>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {(tech as any).meaning}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">USE</p>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {(tech as any).use}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <label htmlFor="topic-input" className="sr-only">Study Topic</label>
            <Input
                id="topic-input"
                name="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter study topic (e.g., Photosynthesis)"
                required // Make topic required
            />

            <Button onClick={handleTechniqueSelect} disabled={!topic.trim()} className="w-full">
                Configure Room
            </Button>
        </div>
    );


    const renderConfigureRoom = () => {
        const maxLimit = selectedMode === 'College' ? 60 : 5;
        const minLimit = 2;

        return (
            <div className="space-y-6">
                <button onClick={() => setModalStep('selectTechnique')} className="flex items-center text-sm text-slate-400 hover:text-white">
                    <ArrowLeft size={16} className="mr-1" /> Back to topic & technique
                </button>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{selectedMode} Mode Settings</h3>
                    <p className="text-sm text-slate-400">Set the maximum number of participants.</p>
                </div>

                {/* Participant Limit Slider */}
                <div>
                    <label htmlFor="limit-slider" className="block text-center text-4xl font-bold text-white mb-4">{userLimit}</label>
                    <input
                        id="limit-slider"
                        name="userLimit"
                        type="range"
                        min={minLimit}
                        max={maxLimit}
                        value={userLimit}
                        onChange={(e) => setUserLimit(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>{minLimit}</span>
                        <span>{maxLimit}</span>
                    </div>
                </div>

                {/* --- FIX: Add Course Selection Dropdown for College Mode --- */}
                {selectedMode === 'College' && (
                    <div>
                        <label htmlFor="course-select" className="block text-sm font-medium text-slate-300 mb-2">Select Course</label>
                        <Select
                            id="course-select"
                            name="courseId"
                            value={courseId ?? ''} // Use empty string for the default option
                            onChange={(e) => setCourseId(e.target.value || null)} // Set to null if default is selected
                            disabled={isLoadingCourses}
                        >
                            {/* Add a default/general option */}
                            <option value="">General / University Wide</option>
                            {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                        </Select>
                        {isLoadingCourses && <p className="text-xs text-slate-400 mt-1">Loading courses...</p>}
                    </div>
                )}
                {/* --- END FIX --- */}

                <Button onClick={handleCreateRoom} className="w-full" isLoading={isCreatingRoom}>
                    Create and Join Room
                </Button>
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create a New Study Room">
            {modalStep === 'selectMode' && renderSelectMode()}
            {modalStep === 'selectTechnique' && renderSelectTechnique()}
            {modalStep === 'configureRoom' && renderConfigureRoom()}
        </Modal>
    );
};

export default CreateRoomModal;