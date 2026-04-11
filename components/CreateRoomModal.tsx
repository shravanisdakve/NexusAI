import React, { useState, useEffect } from 'react';
// --- FIX: Import Select component and Course type ---
import { Modal, Button, Input, Select } from './ui';
import { type Course } from '../types'; // Import Course type
// --- END FIX ---
import { User, Users, Briefcase, ArrowLeft, ArrowRight, MessageSquare, Brain, Timer, Target, Building } from 'lucide-react';
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

interface Technique {
    name: string;
    meaning: string;
    use: string;
    icon: React.ElementType;
}

const techniques: Technique[] = [
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
    const stepInfo = {
        selectMode: { step: 1, title: 'Session Type' },
        selectTechnique: { step: 2, title: 'Study Strategy' },
        configureRoom: { step: 3, title: 'Room Specs' }
    };

    const ProgressBar = () => (
        <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2, 3].map((s) => (
                <div 
                    key={s} 
                    className={`flex items-center gap-2 transition-all duration-500 ${s === stepInfo[modalStep].step ? 'scale-110' : 'opacity-40'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${s <= stepInfo[modalStep].step ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'bg-slate-700'}`}></div>
                    {s === stepInfo[modalStep].step && (
                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none pt-0.5">Step {s}: {stepInfo[modalStep].title}</span>
                    )}
                </div>
            ))}
        </div>
    );

    const renderSelectMode = () => (
        <div className="flex flex-col h-full">
            <ProgressBar />
            <div className="text-center space-y-1 mb-8">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Architect Your Environment</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Choose a high-fidelity sync layout</p>
            </div>

            <div className="grid grid-cols-1 gap-4 flex-1">
                <button 
                    onClick={() => handleModeSelect('Group')} 
                    className="group relative flex flex-col p-5 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-violet-500/50 hover:bg-slate-950 transition-all duration-300 text-left overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-all"></div>
                    <div className="flex items-center gap-4 mb-3 relative z-10">
                        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="font-black text-sm text-white uppercase tracking-tight italic">Group Study</p>
                            <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest leading-none mt-1">2-5 Participants</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed relative z-10 opacity-70">
                        Optimized for intimate collaboration. Private sync, low latency, and focused high-density workspace.
                    </p>
                </button>

                <button 
                    onClick={() => handleModeSelect('College')} 
                    className="group relative flex flex-col p-5 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-amber-500/50 hover:bg-slate-950 transition-all duration-300 text-left overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all"></div>
                    <div className="flex items-center gap-4 mb-3 relative z-10">
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Building size={20} />
                        </div>
                        <div>
                            <p className="font-black text-sm text-white uppercase tracking-tight italic">College Room</p>
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mt-1">Up to 60 Participants</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed relative z-10 opacity-70">
                        University-wide discovery. Perfect for batch lectures, seminar prep, or large-scale peer review.
                    </p>
                </button>
            </div>
        </div>
    );

    const renderSelectTechnique = () => (
        <div className="flex flex-col h-full -mx-8 -my-8 p-8 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                <ProgressBar />
                <button onClick={() => setModalStep('selectMode')} className="flex items-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors mb-6 italic">
                    <ArrowLeft size={14} className="mr-2" /> Resume Mode Selection
                </button>
                
                <div className="text-center space-y-1 mb-10">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Strategic Execution</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Deploy automated study logic</p>
                </div>

                <div className="space-y-3">
                    {techniques.map(tech => {
                        const isSelected = selectedTechnique === tech.name;
                        return (
                            <button
                                key={tech.name}
                                onClick={() => setSelectedTechnique(tech.name)}
                                className={`group w-full p-4 rounded-2xl text-left transition-all duration-500 border relative overflow-hidden ${
                                    isSelected 
                                        ? 'bg-slate-950 border-violet-500/30' 
                                        : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl border transition-all ${isSelected ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-950 border-white/5 text-slate-500'}`}>
                                            <tech.icon size={18} />
                                        </div>
                                        <div>
                                            <h4 className={`font-black text-[13px] uppercase tracking-wider italic ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                                {tech.name}
                                            </h4>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-0.5">Automated Workload Protocol</p>
                                        </div>
                                    </div>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,1)]"></div>}
                                </div>
                                
                                <div className={`grid transition-all duration-500 ease-in-out ${
                                    isSelected ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'
                                }`}>
                                    <div className="overflow-hidden">
                                        <div className="pl-4 border-l-2 border-violet-500/20 space-y-6 pb-2">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-2 italic">Phase I: Concept</p>
                                                <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                                                    {tech.meaning}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2 italic">Phase II: Execution</p>
                                                <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                                                    {tech.use}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-10 mb-8 space-y-2">
                    <label htmlFor="topic-input" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-60">Specific Research Topic</label>
                    <Input
                        id="topic-input"
                        name="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. MASTER ORGANIC MECHANISMS"
                        className="h-14 bg-slate-950 border-white/5 font-black text-xs tracking-widest focus:ring-violet-500/20 uppercase italic"
                        required
                    />
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="mt-auto pt-6 border-t border-white/[0.04] bg-slate-900/80 backdrop-blur-xl relative z-30">
                <Button onClick={handleTechniqueSelect} disabled={!topic.trim()} className="w-full h-14 text-[10px] font-black uppercase tracking-widest bg-violet-600 shadow-2xl shadow-violet-600/20 group">
                    Continue to setup <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );


    const renderConfigureRoom = () => {
        const maxLimit = selectedMode === 'College' ? 60 : 5;
        const minLimit = 2;

        return (
            <div className="flex flex-col h-full">
                <ProgressBar />
                <button onClick={() => setModalStep('selectTechnique')} className="flex items-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors mb-6 italic">
                    <ArrowLeft size={14} className="mr-2" /> Modify Strategy
                </button>
                
                <div className="text-center space-y-1 mb-10">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Final Specifications</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Calibrate resource and access</p>
                </div>

                <div className="space-y-8 flex-1">
                    {/* Participant Limit Slider */}
                    <div className="bg-slate-950/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex flex-col items-center relative z-10">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 italic">Throughput Density</span>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-7xl font-black text-white italic tabular-nums leading-none tracking-tighter">{userLimit}</span>
                                <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest pb-1 opacity-80">Seats</span>
                            </div>
                            <input
                                id="limit-slider"
                                name="userLimit"
                                type="range"
                                min={minLimit}
                                max={maxLimit}
                                value={userLimit}
                                onChange={(e) => setUserLimit(parseInt(e.target.value, 10))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 mb-6"
                            />
                            <div className="flex justify-between w-full text-[9px] font-black text-slate-700 uppercase tracking-widest italic opacity-40">
                                <span>MIN_SPEC {minLimit}</span>
                                <span>MAX_SPEC {maxLimit}</span>
                            </div>
                        </div>
                    </div>

                    {selectedMode === 'College' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <label htmlFor="course-select" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-60">Institutional Hub</label>
                            <Select
                                id="course-select"
                                name="courseId"
                                value={courseId ?? ''}
                                onChange={(e) => setCourseId(e.target.value || null)}
                                disabled={isLoadingCourses}
                                className="h-14 bg-slate-950 border-white/5 font-black text-xs tracking-widest italic focus:ring-violet-500/20 uppercase"
                            >
                                <option value="">Global Ecosystem</option>
                                {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                            </Select>
                        </div>
                    )}
                </div>

                <div className="pt-8 mt-10 border-t border-white/[0.04]">
                    <Button onClick={handleCreateRoom} className="w-full h-16 text-[11px] font-black uppercase tracking-[0.3em] bg-violet-600 shadow-2xl shadow-violet-600/30 hover:scale-[1.01] transition-all group" isLoading={isCreatingRoom}>
                        Initialize Sync Room <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-[8px] text-center text-slate-600 mt-6 leading-relaxed uppercase tracking-[0.2em] font-black italic opacity-40">
                        ESTABLISHING SECURE CONNECTION VIA <span className="text-violet-500">NEXUS PROTOCOL</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Initialize Research Lobby" size="lg">
            {modalStep === 'selectMode' && renderSelectMode()}
            {modalStep === 'selectTechnique' && renderSelectTechnique()}
            {modalStep === 'configureRoom' && renderConfigureRoom()}
        </Modal>
    );
};

export default CreateRoomModal;