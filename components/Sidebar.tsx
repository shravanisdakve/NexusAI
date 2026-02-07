import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { NavLink, useNavigate } from 'react-router-dom';
// --- FIX: Added Modal, Input, Button, Spinner ---
import { Modal, Input, Button, Spinner } from './ui'; // Import necessary UI components
// --- END FIX ---
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
// --- FIX: Added Edit3 icon ---
import { LayoutDashboard, MessageSquare, Share2, FileText, Code, BrainCircuit, LogOut, BarChart2, Users, ClipboardList, Edit3, GraduationCap, Briefcase, Shield, Bell } from 'lucide-react';
// --- END FIX ---


// --- FIX: Define ProfileEditModal here (or import if moved to separate file) ---
interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onSave: (newName: string) => Promise<void>;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, currentName, onSave }) => {
    const [newName, setNewName] = useState(currentName);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNewName(currentName);
            setError(null);
        }
    }, [isOpen, currentName]);

    const handleSave = async () => {
        if (!newName.trim() || newName === currentName) {
            onClose();
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            await onSave(newName.trim());
            onClose();
        } catch (err) {
            console.error("Profile save failed:", err);
            setError(err instanceof Error ? err.message : "Failed to save profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <div className="space-y-4">
                <div>
                    <label htmlFor="displayNameSidebar" className="block text-sm font-medium text-slate-300 mb-1">
                        Display Name
                    </label>
                    <Input
                        id="displayNameSidebar" // Use unique ID if needed
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter your display name"
                        disabled={isSaving}
                    />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        disabled={!newName.trim() || newName === currentName || isSaving}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
// --- END ProfileEditModal definition ---


const navigation = [
    { name: 'Study Hub', href: '/', icon: LayoutDashboard },
    { name: 'MU Curriculum', href: '/curriculum', icon: GraduationCap },

    { name: 'Placement Arena', href: '/placement', icon: Briefcase },
    { name: 'University Hub', href: '/university-status', icon: Bell },
    { name: 'Notes', href: '/notes', icon: FileText },
    { name: 'AI Tutor', href: '/tutor', icon: MessageSquare },
    { name: 'Study Room', href: '/study-lobby', icon: Users },
];

const Sidebar: React.FC = () => {
    // --- FIX: Added updateUserProfile and modal state ---
    const { user, logout, updateUserProfile } = useAuth(); // Get updateUserProfile
    const { language, setLanguage } = useLanguage();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Add modal state
    // --- END FIX ---
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // --- FIX: Added save handler ---
    const handleProfileSave = async (newName: string) => {
        if (!updateUserProfile) {
            console.error("updateUserProfile function is not available from AuthContext!");
            // Handle error appropriately, maybe show a message
            throw new Error("Profile update function not loaded."); // Throw to show error in modal
        }
        try {
            await updateUserProfile({ displayName: newName });
            // Optional: Show a success message if needed
        } catch (error) {
            // Error is logged in context, modal will show message from thrown error
            throw error; // Re-throw for modal
        }
    };
    // --- END FIX ---


    return (
        <> {/* Added Fragment to wrap sidebar and modal */}
            <aside className="w-[280px] flex-shrink-0 bg-[#0F1117] border-r border-white/5 p-6 flex flex-col"> {/* Updated width and border */}
                <div className="flex items-center mb-10">
                    <div className="p-2 bg-violet-600 rounded-lg">
                        <BrainCircuit className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold ml-3 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
                        NexusAI
                    </h1>
                </div>
                <nav className="flex-1 space-y-2">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            end={item.href === '/'}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-l-[3px] ${isActive
                                    ? 'bg-violet-500/15 border-violet-500 text-white'
                                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="px-3 py-3 rounded-xl bg-surface/50 border border-white/5"> {/* Updated user card */}
                        {user && (
                            <div className="flex items-center space-x-3 mb-6">
                                <img src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} alt="User avatar" className="w-10 h-10 rounded-full border border-violet-500/20" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold text-sm text-white truncate">{user.displayName || 'User'}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active: {user.branch || 'CO'}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 text-slate-400 hover:text-white"
                                    onClick={() => setIsProfileModalOpen(true)}
                                    title="Edit Profile"
                                >
                                    <Edit3 size={16} />
                                </Button>
                            </div>
                        )}

                        {/* Anuvadini AI Toggle */}
                        <div className="flex items-center justify-between p-2 mb-4 bg-slate-900/50 rounded-lg border border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Anuvadini AI</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${language === 'en' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-slate-500'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('mr')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${language === 'mr' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-slate-500'}`}
                                >
                                    मरा
                                </button>
                                <button
                                    onClick={() => setLanguage('hi')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${language === 'hi' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-slate-500'}`}
                                >
                                    हिं
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-300 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="mr-2 h-5 w-5" />
                            Logout
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-4">&copy; 2024 NexusAI. All rights reserved.</p>
                </div>
            </aside>

            {/* --- FIX: Render the Profile Edit Modal --- */}
            {user && (
                <ProfileEditModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    currentName={user.displayName || ''}
                    onSave={handleProfileSave}
                />
            )}
            {/* --- END FIX --- */}
        </>
    );
};

export default Sidebar;