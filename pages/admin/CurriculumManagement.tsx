import React, { useEffect, useState } from 'react';
import { getCurriculum, createCurriculum, updateCurriculum, deleteCurriculum } from '../../services/adminService';
import { 
    BookOpen, 
    Layers, 
    GraduationCap, 
    Plus, 
    Edit, 
    Save, 
    Trash2,
    ChevronDown,
    ChevronUp,
    Search,
    X,
    Archive
} from 'lucide-react';
import { Button, Input, Modal } from '../../components/ui';

const CurriculumManagement: React.FC = () => {
    const [curriculum, setCurriculum] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<any>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        branch: '',
        scheme: 'C-Scheme (2019)',
        university: 'Mumbai University'
    });

    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [activeSemester, setActiveSemester] = useState<number | null>(null);
    const [editingSubject, setEditingSubject] = useState<any>(null);
    const [subjectData, setSubjectData] = useState({
        name: '',
        subjectCode: '',
        credits: 4,
        category: 'Core'
    });

    const fetchCurriculum = async () => {
        setLoading(true);
        try {
            const data = await getCurriculum();
            if (data.success) {
                setCurriculum(data.curriculum);
            }
        } catch (error) {
            console.error('Failed to fetch curriculum');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurriculum();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedBranch) {
                await updateCurriculum(selectedBranch._id, formData);
            } else {
                await createCurriculum(formData);
            }
            setIsModalOpen(false);
            fetchCurriculum();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await deleteCurriculum(confirmDeleteId);
            setCurriculum(curriculum.filter(c => c._id !== confirmDeleteId));
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Delete failed');
        }
    };

    const handleAddSemester = async (branchId: string) => {
        const branch = curriculum.find(b => b._id === branchId);
        if (!branch) return;
        
        const nextSemNumber = (branch.semesters?.length || 0) + 1;
        const newSemesters = [...(branch.semesters || []), { semesterNumber: nextSemNumber, subjects: [] }];
        
        try {
            await updateCurriculum(branchId, { semesters: newSemesters });
            fetchCurriculum();
        } catch (error) {
            console.error('Failed to add semester');
        }
    };

    const handleSaveSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBranch || activeSemester === null) return;
        
        const branchId = selectedBranch._id;
        const newSemesters = JSON.parse(JSON.stringify(selectedBranch.semesters || []));
        const semIndex = newSemesters.findIndex((s: any) => s.semesterNumber === activeSemester);
        
        if (semIndex === -1) return;
        
        if (editingSubject) {
            const subIndex = newSemesters[semIndex].subjects.findIndex((s: any) => s._id === editingSubject._id);
            if (subIndex !== -1) newSemesters[semIndex].subjects[subIndex] = { ...editingSubject, ...subjectData };
        } else {
            newSemesters[semIndex].subjects.push(subjectData);
        }
        
        try {
            await updateCurriculum(branchId, { semesters: newSemesters });
            setIsSubjectModalOpen(false);
            fetchCurriculum();
        } catch (error) {
            console.error('Failed to save subject');
        }
    };

    const toggleBranch = (id: string) => {
        setExpandedBranch(expandedBranch === id ? null : id);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Curriculum Architect</h1>
                    <p className="text-xs text-slate-500 font-medium">Define university structures, branches, semesters, and subject modules.</p>
                </div>

                <Button 
                    onClick={() => { setSelectedBranch(null); setFormData({ branch: '', scheme: 'C-Scheme (2019)', university: 'Mumbai University' }); setIsModalOpen(true); }}
                    variant="primary" 
                    className="gap-2 !h-10 px-6"
                >
                    <Plus size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Branch</span>
                </Button>
            </div>

            <div className="bg-[#0A0C10] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            id="curriculum-search"
                            name="search"
                            type="text" 
                            placeholder="Find branch or scheme..." 
                            className="bg-white/5 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-[10px] font-medium text-white focus:outline-none w-64"
                        />
                    </div>
                </div>

                <div className="divide-y divide-white/[0.03]">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest animate-pulse">Syncing Structural Archives...</div>
                    ) : curriculum.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 italic text-xs">No curriculum data defined.</div>
                    ) : (
                        curriculum.map((item) => (
                            <div key={item._id} className="group transition-all">
                                <div 
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-colors"
                                    onClick={() => toggleBranch(item._id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform border border-white/5">
                                            <GraduationCap size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight">{item.branch}</h3>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.scheme} • {item.university}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedBranch(item); setFormData({ branch: item.branch, scheme: item.scheme, university: item.university }); setIsModalOpen(true); }}
                                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item._id); }}
                                                className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {expandedBranch === item._id ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                </div>

                                {expandedBranch === item._id && (
                                    <div className="px-5 pb-5 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        {item.semesters?.map((sem: any) => (
                                            <div key={sem.semesterNumber} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                                                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semester {sem.semesterNumber}</span>
                                                    <div className="flex items-center gap-2">
                                                       <Plus 
                                                           size={12} 
                                                           className="text-slate-600 hover:text-emerald-400 cursor-pointer transition-colors" 
                                                           onClick={(e) => { e.stopPropagation(); setSelectedBranch(item); setActiveSemester(sem.semesterNumber); setEditingSubject(null); setSubjectData({ name: '', subjectCode: '', credits: 4, category: 'Core' }); setIsSubjectModalOpen(true); }}
                                                       />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {sem.subjects?.map((sub: any) => (
                                                        <div key={sub.subjectCode} className="flex items-center justify-between group/sub">
                                                            <span className="text-[10px] font-medium text-slate-300 truncate max-w-[120px]">{sub.name}</span>
                                                            <div className="flex items-center gap-2">
                                                               <span className="text-[8px] font-mono text-slate-600 px-1 bg-black/40 rounded border border-white/5">{sub.subjectCode}</span>
                                                               <Edit 
                                                                   size={10} 
                                                                   className="text-slate-700 hover:text-white cursor-pointer opacity-0 group-hover/sub:opacity-100 transition-all" 
                                                                   onClick={(e) => { e.stopPropagation(); setSelectedBranch(item); setActiveSemester(sem.semesterNumber); setEditingSubject(sub); setSubjectData({ name: sub.name, subjectCode: sub.subjectCode, credits: sub.credits || 4, category: sub.category || 'Core' }); setIsSubjectModalOpen(true); }}
                                                               />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!sem.subjects || sem.subjects.length === 0) && (
                                                        <p className="text-[10px] text-slate-600 italic">No subjects added.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button 
                                           onClick={() => handleAddSemester(item._id)}
                                           className="bg-white/[0.01] border border-dashed border-white/10 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-violet-400 hover:border-violet-500/30 transition-all cursor-pointer"
                                        >
                                            <Plus size={16} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">New Semester</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedBranch ? "Modify Curriculum Branch" : "Establish New Curriculum"}
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="curr-branch" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-slate-500">Branch Name</label>
                        <Input 
                            id="curr-branch"
                            name="branch"
                            required
                            value={formData.branch}
                            onChange={(e) => setFormData({...formData, branch: e.target.value})}
                            placeholder="e.g. Computer Engineering"
                            className="!bg-black/20 !border-white/10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="curr-scheme" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-slate-500">Grading Scheme</label>
                            <Input 
                                id="curr-scheme"
                                name="scheme"
                                required
                                value={formData.scheme}
                                onChange={(e) => setFormData({...formData, scheme: e.target.value})}
                                placeholder="e.g. C-Scheme"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="curr-university" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-slate-500">University</label>
                            <Input 
                                id="curr-university"
                                name="university"
                                required
                                value={formData.university}
                                onChange={(e) => setFormData({...formData, university: e.target.value})}
                                placeholder="e.g. Mumbai University"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={() => setIsModalOpen(false)}
                            className="text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            variant="primary"
                            className="px-8 flex items-center gap-2"
                        >
                            <Save size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {selectedBranch ? "Update Schema" : "Initialize Branch"}
                            </span>
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Subject Modal */}
            <Modal
                isOpen={isSubjectModalOpen}
                onClose={() => setIsSubjectModalOpen(false)}
                title={editingSubject ? "Modify Subject Module" : "Forge New Subject Node"}
            >
                <form onSubmit={handleSaveSubject} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Subject Name</label>
                            <Input 
                                required
                                value={subjectData.name}
                                onChange={(e) => setSubjectData({...subjectData, name: e.target.value})}
                                placeholder="e.g. Theory of Computation"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject Code</label>
                            <Input 
                                required
                                value={subjectData.subjectCode}
                                onChange={(e) => setSubjectData({...subjectData, subjectCode: e.target.value})}
                                placeholder="e.g. CSC501"
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credits</label>
                            <Input 
                                type="number"
                                required
                                value={subjectData.credits}
                                onChange={(e) => setSubjectData({...subjectData, credits: parseInt(e.target.value)})}
                                className="!bg-black/20 !border-white/10"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Knowledge Category</label>
                            <select 
                                value={subjectData.category}
                                onChange={(e) => setSubjectData({...subjectData, category: e.target.value})}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-xs font-medium text-white focus:outline-none focus:border-violet-500/50"
                            >
                                <option value="Core">Core Engineering</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Professional Elective">Professional Elective</option>
                                <option value="Open Elective">Open Elective</option>
                                <option value="Laboratory">Engineering Laboratory</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={() => setIsSubjectModalOpen(false)}
                            className="text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            variant="primary"
                            className="px-8 bg-violet-600 hover:bg-violet-700"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {editingSubject ? "Refine Subject" : "Commit Module"}
                            </span>
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Confirm Data Erasure"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-rose-200 uppercase tracking-widest">Total Branch Purge</p>
                            <p className="text-[11px] text-rose-300/60 font-medium">
                                You are about to permanently delete this entire branch curriculum, including all semesters and subject modules.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button 
                            type="button"
                            variant="ghost" 
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDelete}
                            variant="primary"
                            className="px-8 bg-rose-600 hover:bg-rose-700 border-none"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Purge Branch</span>
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="p-4 bg-violet-600/5 border border-violet-500/10 rounded-2xl flex items-center gap-4">
                <Archive className="text-violet-400" size={24} />
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Notice: Modification of core curriculum branches affects global study planning and resource classification. Use caution when removing active structural nodes.
                </p>
            </div>
        </div>
    );
};

export default CurriculumManagement;
