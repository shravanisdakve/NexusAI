import React, { useEffect, useState } from 'react';
import { 
    FileText, 
    MessageSquare, 
    Trash2, 
    Eye, 
    Flag, 
    Search,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    User,
    RefreshCw,
    X,
    ShieldAlert,
    ExternalLink
} from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import { getContent, deleteContent, flagContent } from '../../services/adminService';

const ContentManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'notes' | 'chats' | 'whiteboards'>('notes');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [flaggingId, setFlaggingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getContent(activeTab);
            if (data.success) {
                setItems(data.notes || data.messages || data.whiteboards || []);
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            const data = await deleteContent(activeTab, confirmDeleteId);
            if (data.success) {
                setItems(items.filter(item => item._id !== confirmDeleteId));
                setConfirmDeleteId(null);
            }
        } catch (error) {
            console.error('Delete failed');
        }
    };

    const handleFlag = async (id: string) => {
        try {
            const data = await flagContent(activeTab, id);
            if (data.success) {
                setItems(items.map(item => item._id === id ? { ...item, isFlagged: !item.isFlagged } : item));
            }
        } catch (error) {
            console.error('Flag failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Content Intelligence & Moderation</h1>
                    <p className="text-xs text-slate-500 font-medium">Investigate user-generated material, shared notes, and room communications.</p>
                </div>
                <button 
                    onClick={fetchData}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex items-center gap-4 border-b border-white/5 pb-1">
                {[
                    { id: 'notes', label: 'User Notes' },
                    { id: 'chats', label: 'Study Chats' },
                    { id: 'whiteboards', label: 'Whiteboards' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                                ? 'text-violet-400 border-b-2 border-violet-400' 
                                : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-[#0A0C10] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Content ID</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Owner</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Subject</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Modified</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-8 bg-white/[0.01]" />
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 italic text-xs">No active {activeTab} recorded.</td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item._id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-violet-400 transition-colors">
                                                    {activeTab === 'notes' ? <FileText size={16} /> : activeTab === 'chats' ? <MessageSquare size={16} /> : <Eye size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white max-w-[200px] truncate">
                                                        {activeTab === 'notes' ? item.title : activeTab === 'chats' ? item.content : item.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{item._id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase border border-white/5 shadow-inner">
                                                    {(activeTab === 'notes' || activeTab === 'chats' ? item.userId?.displayName : item.createdBy?.displayName)?.charAt(0) || <User size={10} />}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-300">
                                                    {(activeTab === 'notes' || activeTab === 'chats' ? item.userId?.displayName : item.createdBy?.displayName) || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                {item.courseId?.name || item.roomId?.name || item.topic || 'General'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                                                activeTab === 'notes' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                                activeTab === 'chats' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                                {activeTab === 'whiteboards' ? `${item.whiteboardSnapshot?.length || 0} strokes` : item.type || 'text'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(item.updatedAt || item.timestamp).toLocaleDateString()}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => setViewItem(item)}
                                                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                                                    title="Quick View"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleFlag(item._id)}
                                                    className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${item.isFlagged ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20' : 'text-slate-500 hover:text-amber-500'}`}
                                                    title={item.isFlagged ? "Unflag" : "Mark as Flagged"}
                                                >
                                                    <Flag size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmDeleteId(item._id)}
                                                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-rose-500 transition-colors"
                                                    title="Destroy"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-violet-600/5 border border-violet-500/10 rounded-2xl">
                <AlertCircle className="text-violet-400" size={18} />
                <p className="text-[11px] text-slate-400 font-medium">
                    Pro-tip: Content flagged as "Low Quality" or "Academic Dishonesty" will be automatically de-indexed from the AI context window.
                </p>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Confirm Data Destruction"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                        <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-rose-200 uppercase tracking-widest">Irreversible Wipe</p>
                            <p className="text-[11px] text-rose-300/60 font-medium">
                                You are about to permanently purge this {activeTab === 'notes' ? 'document' : activeTab === 'chats' ? 'message' : 'whiteboard session'} from the archive.
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
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Destroy Content</span>
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* View Content Modal */}
            <Modal
                isOpen={!!viewItem}
                onClose={() => setViewItem(null)}
                title={activeTab === 'notes' ? "Document Inspection" : activeTab === 'chats' ? "Communication Log" : "Board Vector Analysis"}
            >
                {viewItem && (
                    <div className="space-y-6">
                        <div className="p-6 bg-black/40 border border-white/10 rounded-2xl min-h-[200px] max-h-[400px] overflow-y-auto">
                            {activeTab === 'notes' ? (
                                <div className="prose prose-invert prose-xs">
                                    <h3 className="text-white font-bold mb-4">{viewItem.title}</h3>
                                    <p className="text-slate-300 leading-relaxed font-medium">{viewItem.content || 'This document has no textual metadata.'}</p>
                                    
                                    {viewItem.type === 'file' && viewItem.fileUrl && (
                                        <div className="mt-8 pt-6 border-t border-white/5">
                                            <a 
                                                href={viewItem.fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full p-4 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded-xl transition-all group"
                                            >
                                                <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">View Original Source</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : activeTab === 'chats' ? (
                                <div className="space-y-4 font-medium">
                                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Message Payload</span>
                                    </div>
                                    <p className="text-xs text-white bg-white/5 p-4 rounded-xl border border-white/5">
                                        {viewItem.content}
                                    </p>
                                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                        <span>Sender: {viewItem.senderName}</span>
                                        <span>Room: {viewItem.roomId?.name || 'Network Node'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <Eye size={32} />
                                    </div>
                                    <p className="text-xs text-center text-slate-400 font-medium">
                                        Whiteboard session includes <span className="text-emerald-400 font-bold">{viewItem.whiteboardSnapshot?.length || 0}</span> vector strokes.<br/>
                                        Visual rendering of historical snapshots is currently pending deployment.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Created At</p>
                                <p className="text-[10px] text-white font-semibold">{new Date(viewItem.createdAt || viewItem.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Owner Trace</p>
                                <p className="text-[10px] text-white font-semibold truncate">{(activeTab === 'notes' || activeTab === 'chats' ? viewItem.userId?.email : viewItem.createdBy?.email) || 'System Process'}</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button 
                                onClick={() => setViewItem(null)}
                                variant="primary"
                                className="px-10"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest">Close Console</span>
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ContentManagement;
