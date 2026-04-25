import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Save, X, Camera, User as UserIcon, Building, GraduationCap, BookOpen, PenTool } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';

const EditProfilePage: React.FC = () => {
    const { user, updateUserProfile } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        college: user?.college || '',
        branch: user?.branch || '',
        semester: user?.semester || '',
        bio: user?.bio || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    if (!user) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUserProfile(formData);
            showToast('Profile updated successfully! ✨', 'success');
            navigate('/profile');
        } catch (error) {
            showToast('Failed to update profile. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#050608] custom-scrollbar h-full">
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Edit Profile</h1>
                        <p className="text-slate-500 font-medium mt-1">Update your personal and academic identity.</p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate('/profile')} className="rounded-xl">
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Avatar Upload Placeholder */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-white/5">
                        <div className="relative">
                            <img
                                src={`https://ui-avatars.com/api/?name=${formData.displayName || 'User'}&background=random&size=64`}
                                alt="Profile Avatar"
                                className="w-16 h-16 rounded-full border border-violet-500/20"
                            />
                            <button type="button" className="absolute -bottom-1 -right-1 p-1.5 bg-violet-600 rounded-full text-white shadow-lg z-20 hover:scale-110 transition-transform">
                                <Camera size={12} />
                            </button>
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-white">Profile Photo</p>
                            <p className="text-[11px] text-slate-500">Update your account avatar.</p>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="profile-displayName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 px-1">Full Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <Input
                                    id="profile-displayName"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="pl-12 bg-slate-900/50 border-white/5 rounded-2xl h-14 text-sm font-bold"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="profile-college" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 px-1">College</label>
                            <div className="relative">
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <Input
                                    id="profile-college"
                                    name="college"
                                    value={formData.college}
                                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                    className="pl-12 bg-slate-900/50 border-white/5 rounded-2xl h-14 text-sm font-bold"
                                    placeholder="Enter your college"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="profile-branch" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 px-1">Branch</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <Input
                                    id="profile-branch"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                    className="pl-12 bg-slate-900/50 border-white/5 rounded-2xl h-14 text-sm font-bold"
                                    placeholder="Enter your branch"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="profile-semester" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 px-1">Semester</label>
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <Input
                                    id="profile-semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    className="pl-12 bg-slate-900/50 border-white/5 rounded-2xl h-14 text-sm font-bold"
                                    placeholder="VI"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 px-1">Bio / About Me</label>
                        <div className="relative">
                            <PenTool className="absolute left-4 top-4 text-slate-500" size={18} />
                            <textarea
                                id="profile-bio"
                                name="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-[2rem] min-h-[120px] text-sm font-medium text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>
                    </div>

                    {/* Sticky Save Bar */}
                    <div className="sticky bottom-0 bg-[#050608] border-t border-white/10 p-4 -mx-4 lg:-mx-8 mt-8 flex justify-end gap-3 z-30 shadow-[0_-10px_40px_rgba(5,6,8,0.9)]">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/profile')}
                            className="px-6 rounded-lg h-[38px] text-[13px] text-slate-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={isSaving}
                            className="px-8 rounded-lg h-[38px] text-[13px] font-bold bg-violet-600 hover:bg-violet-500 text-white"
                        >
                            <Save size={16} className="mr-2" />
                            Save Profile
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;
