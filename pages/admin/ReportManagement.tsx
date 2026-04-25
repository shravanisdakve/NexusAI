import React, { useEffect, useState } from 'react';
import { 
    ShieldAlert, 
    AlertTriangle, 
    CheckCircle2, 
    MoreVertical, 
    RefreshCw, 
    XCircle, 
    Eye, 
    Trash2,
    ShieldOff,
    Search,
    Filter
} from 'lucide-react';
import { Button, Modal, Select, Input } from '../../components/ui';
import { getReports, updateReport, deleteReport } from '../../services/adminService';

const ReportManagement: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getReports();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        setActionLoading(true);
        try {
            const data = await updateReport(id, { status, adminNotes });
            if (data.success) {
                setReports(reports.map(r => r._id === id ? data.report : r));
                setIsActionModalOpen(false);
                setSelectedReport(null);
                setAdminNotes('');
            }
        } catch (error) {
            console.error('Update failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteReport = async () => {
        if (!confirmDeleteId) return;
        try {
            const data = await deleteReport(confirmDeleteId);
            if (data.success) {
                setReports(reports.filter(r => r._id !== confirmDeleteId));
                setConfirmDeleteId(null);
            }
        } catch (error) {
            console.error('Delete failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Security & Incident Reports</h1>
                    <p className="text-xs text-slate-500 font-medium">Handle user reports, policy violations, and critical system alerts.</p>
                </div>
                <button 
                    onClick={fetchReports}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-[#0A0C10] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search incidents..." 
                                className="bg-white/5 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-[10px] font-medium text-white focus:outline-none w-64"
                            />
                        </div>
                        <Button variant="ghost" className="!h-8 px-3 gap-2">
                            <Filter size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Filter</span>
                        </Button>
                    </div>
                </div>

                <div className="divide-y divide-white/[0.03]">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest animate-pulse">Retrieving Incident Protocols...</div>
                    ) : reports.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 italic text-xs">No pending security incidents.</div>
                    ) : (
                        reports.map((report) => (
                            <div key={report._id} className="p-5 flex items-center justify-between group hover:bg-white/[0.01] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl border ${
                                        report.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                        report.priority === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                        <ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">{report.targetType} Violation</h3>
                                            <span className="text-[8px] font-mono text-slate-600 px-1 border border-white/5 rounded">ID: {report._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            Reported by <span className="text-slate-200">{report.reporterId?.displayName || 'Unknown'}</span> • Priority: <span className="text-slate-200">{report.priority}</span>
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Reason:</span>
                                            <span className="text-[10px] text-slate-300 italic">"{report.reason}"</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right mr-4">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                            report.status === 'Pending' ? 'text-amber-400 bg-amber-400/5 border border-amber-400/20' : 
                                            report.status === 'In Review' ? 'text-blue-400 bg-blue-400/5 border border-blue-400/20' :
                                            report.status === 'Resolved' ? 'text-emerald-400 bg-emerald-400/5 border border-emerald-400/20' :
                                            'text-slate-500 bg-white/5 border border-white/10'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => { setSelectedReport(report); setIsActionModalOpen(true); }}
                                            className="p-2 hover:bg-violet-500/10 text-slate-500 hover:text-violet-400 rounded-lg transition-colors"
                                            title="Investigate"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button 
                                            onClick={() => setConfirmDeleteId(report._id)}
                                            className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
                                            title="Archive Report"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="text-rose-500" size={18} />
                <p className="text-[11px] text-slate-100 font-medium">
                    Policy Notice: Automatic ban threshold for "Hate Speech" reports is currently set to 3 unique user reports within 24 hours.
                </p>
            </div>

            {/* Investigation & Action Modal */}
            <Modal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                title="Incident Investigation Console"
            >
                {selectedReport && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reporter Information</p>
                                <p className="text-xs text-white font-semibold">{selectedReport.reporterId?.displayName}</p>
                                <p className="text-[10px] text-slate-400">{selectedReport.reporterId?.email}</p>
                            </div>
                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Object</p>
                                <p className="text-xs text-white font-semibold">{selectedReport.targetType}</p>
                                <p className="text-[10px] text-slate-400 font-mono">ID: {selectedReport.targetId}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal Investigative Notes</label>
                            <textarea 
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Describe findings or rationale for resolution..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs text-white min-h-[100px] focus:outline-none focus:border-violet-500/30 transition-all font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button 
                                onClick={() => handleUpdateStatus(selectedReport._id, 'Resolved')}
                                isLoading={actionLoading}
                                variant="primary"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-none gap-2"
                            >
                                <CheckCircle2 size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Resolve</span>
                            </Button>
                            <Button 
                                onClick={() => handleUpdateStatus(selectedReport._id, 'Dismissed')}
                                isLoading={actionLoading}
                                variant="ghost"
                                className="flex-1 hover:bg-rose-500/10 hover:text-rose-500 gap-2 border-white/5"
                            >
                                <XCircle size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Dismiss</span>
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Archive Confirmation Modal */}
            <Modal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                title="Archive Security Protocol"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-200 uppercase tracking-widest">Archive Incident</p>
                            <p className="text-[11px] text-amber-300/60 font-medium">
                                You are about to move this report to the permanent archives. It will no longer appear in the active queue.
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
                            onClick={handleDeleteReport}
                            variant="primary"
                            className="px-8 bg-amber-600 hover:bg-amber-700 border-none"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Archive Now</span>
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ReportManagement;
