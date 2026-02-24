import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card, Input } from '../components/ui';
import {
    ClipboardList, ArrowLeft, Plus, Trash2, Edit3, ChevronRight,
    Calendar, Building2, IndianRupee, GripVertical, X, Check
} from 'lucide-react';
import { trackToolUsage } from '../services/personalizationService';

type Status = 'upcoming' | 'applied' | 'aptitude' | 'gd' | 'technical' | 'hr' | 'offer' | 'rejected';

interface Application {
    id: string;
    company: string;
    role: string;
    ctc: string;
    date: string;
    status: Status;
    notes: string;
}

const STATUS_CONFIG: { id: Status; label: string; color: string; bgColor: string; borderColor: string }[] = [
    { id: 'upcoming', label: '📅 Upcoming', color: 'text-slate-300', bgColor: 'bg-slate-800/50', borderColor: 'border-slate-700' },
    { id: 'applied', label: '📝 Applied', color: 'text-blue-300', bgColor: 'bg-blue-500/5', borderColor: 'border-blue-500/20' },
    { id: 'aptitude', label: '🧠 Aptitude', color: 'text-violet-300', bgColor: 'bg-violet-500/5', borderColor: 'border-violet-500/20' },
    { id: 'gd', label: '💬 GD', color: 'text-cyan-300', bgColor: 'bg-cyan-500/5', borderColor: 'border-cyan-500/20' },
    { id: 'technical', label: '💻 Technical', color: 'text-amber-300', bgColor: 'bg-amber-500/5', borderColor: 'border-amber-500/20' },
    { id: 'hr', label: '🤝 HR', color: 'text-emerald-300', bgColor: 'bg-emerald-500/5', borderColor: 'border-emerald-500/20' },
    { id: 'offer', label: '🎉 Offer', color: 'text-green-300', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    { id: 'rejected', label: '❌ Rejected', color: 'text-rose-300', bgColor: 'bg-rose-500/5', borderColor: 'border-rose-500/20' },
];

const STORAGE_KEY = 'nexusai_placement_tracker';

const PlacementTracker: React.FC = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<Application[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ company: '', role: '', ctc: '', date: '', status: 'upcoming' as Status, notes: '' });
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

    useEffect(() => { trackToolUsage('placement'); }, []);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setApplications(JSON.parse(saved)); } catch { }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    }, [applications]);

    const resetForm = () => {
        setForm({ company: '', role: '', ctc: '', date: '', status: 'upcoming', notes: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.company.trim()) return;

        if (editingId) {
            setApplications(prev => prev.map(app => app.id === editingId ? { ...app, ...form } : app));
        } else {
            const newApp: Application = { ...form, id: Date.now().toString() };
            setApplications(prev => [...prev, newApp]);
        }
        resetForm();
    };

    const handleEdit = (app: Application) => {
        setForm({ company: app.company, role: app.role, ctc: app.ctc, date: app.date, status: app.status, notes: app.notes });
        setEditingId(app.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        setApplications(prev => prev.filter(app => app.id !== id));
    };

    const moveToStatus = (id: string, newStatus: Status) => {
        setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
    };

    const getStatusApps = (status: Status) => applications.filter(app => app.status === status);

    const totalApps = applications.length;
    const offers = applications.filter(a => a.status === 'offer').length;
    const active = applications.filter(a => !['offer', 'rejected'].includes(a.status)).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Total Applications</p>
                    <p className="text-2xl font-black text-white">{totalApps}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Active Pipeline</p>
                    <p className="text-2xl font-black text-blue-400">{active}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Offers</p>
                    <p className="text-2xl font-black text-emerald-400">{offers}</p>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'board' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}>📋 Board</button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}>📝 List</button>
                </div>
                <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 bg-rose-600 hover:bg-rose-500">
                    <Plus size={16} /> Add Application
                </Button>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <Card className="p-6 border-rose-500/20 bg-slate-800/80 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white">{editingId ? 'Edit' : 'Add'} Application</h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Company *</label>
                            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. TCS" required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Role</label>
                            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">CTC</label>
                            <Input value={form.ctc} onChange={(e) => setForm({ ...form, ctc: e.target.value })} placeholder="e.g. 3.6 LPA" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Date</label>
                            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Current Status</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white">
                                {STATUS_CONFIG.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Notes</label>
                            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..." />
                        </div>
                        <div className="md:col-span-2 flex gap-3 justify-end">
                            <Button variant="ghost" type="button" onClick={resetForm}>Cancel</Button>
                            <Button type="submit" className="bg-rose-600 hover:bg-rose-500 gap-2"><Check size={16} /> {editingId ? 'Update' : 'Add'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Board View */}
            {viewMode === 'board' && (
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[1200px]">
                        {STATUS_CONFIG.map(status => {
                            const apps = getStatusApps(status.id);
                            return (
                                <div key={status.id} className={`flex-1 min-w-[200px] rounded-2xl border ${status.borderColor} ${status.bgColor} p-3`}>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h4 className={`text-xs font-black uppercase tracking-wider ${status.color}`}>{status.label}</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">{apps.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {apps.map(app => (
                                            <div key={app.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 group hover:border-slate-500 transition-all">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h5 className="font-bold text-white text-sm">{app.company}</h5>
                                                        {app.role && <p className="text-[10px] text-slate-500">{app.role}</p>}
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(app)} className="p-1 text-slate-500 hover:text-white"><Edit3 size={12} /></button>
                                                        <button onClick={() => handleDelete(app.id)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                                {app.ctc && <p className="text-[10px] text-emerald-400 flex items-center gap-1 mb-1"><IndianRupee size={10} />{app.ctc}</p>}
                                                {app.date && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10} />{app.date}</p>}
                                                {app.notes && <p className="text-[10px] text-slate-600 mt-1 italic">"{app.notes}"</p>}

                                                {/* Quick move buttons */}
                                                {!['offer', 'rejected'].includes(status.id) && (
                                                    <div className="flex gap-1 mt-2 pt-2 border-t border-slate-800">
                                                        {STATUS_CONFIG.filter(s => s.id !== status.id).slice(0, 3).map(s => (
                                                            <button key={s.id} onClick={() => moveToStatus(app.id, s.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 hover:text-white transition-all" title={`Move to ${s.label}`}>
                                                                → {s.label.slice(2, 5)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {apps.length === 0 && (
                                            <div className="p-4 text-center text-[11px] text-slate-600 border border-dashed border-slate-700 rounded-xl">
                                                No applications
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <Card className="p-0 overflow-hidden">
                    {applications.length === 0 ? (
                        <div className="p-12 text-center">
                            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No applications yet. Click "Add Application" to start tracking!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-700/50">
                            {applications.map(app => {
                                const statusConfig = STATUS_CONFIG.find(s => s.id === app.status);
                                return (
                                    <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-all">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                <Building2 size={18} className="text-slate-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-sm">{app.company}</h4>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                                                    {app.role && <span>{app.role}</span>}
                                                    {app.ctc && <span className="text-emerald-400">{app.ctc}</span>}
                                                    {app.date && <span>{app.date}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${statusConfig?.bgColor} ${statusConfig?.color} border ${statusConfig?.borderColor}`}>
                                                {statusConfig?.label}
                                            </span>
                                            <button onClick={() => handleEdit(app)} className="p-1.5 text-slate-500 hover:text-white"><Edit3 size={14} /></button>
                                            <button onClick={() => handleDelete(app.id)} className="p-1.5 text-slate-500 hover:text-rose-400"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default PlacementTracker;
