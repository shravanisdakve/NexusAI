import React from 'react';
import { HelpCircle, Plus, Search, Filter, X } from 'lucide-react';

const QuizManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        category: 'Mathematics',
        difficulty: 'Medium'
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock success
        alert('Question committed to global bank.');
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Quiz Bank & AI Generation</h1>
                    <p className="text-xs text-slate-500 font-medium">Verify AI-generated question quality and manage the global question repository.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg"
                >
                    <Plus size={14} />
                    Create Question
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Mathematics', 'Mechanics', 'Programming', 'Physics'].map(cat => (
                    <div key={cat} className="bg-[#0A0C10] border border-white/5 p-4 rounded-xl hover:border-violet-500/20 transition-all cursor-pointer group">
                        <HelpCircle size={20} className="text-slate-600 group-hover:text-violet-400 mb-2 transition-colors" />
                        <h3 className="text-xs font-bold text-white">{cat}</h3>
                        <p className="text-[10px] text-slate-500 mt-1">120 Question sets</p>
                    </div>
                ))}
            </div>

            <div className="p-12 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-center">
                <div>
                    <Search size={32} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question database visualization arriving soon.</p>
                </div>
            </div>

            {/* Create Question Modal */}
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all ${isModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="bg-[#0A0C10] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white tracking-tight">Forge New Question Node</h2>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleCreate} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Question Content</label>
                            <textarea 
                                required
                                value={formData.question}
                                onChange={(e) => setFormData({...formData, question: e.target.value})}
                                placeholder="Describe the question node..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-violet-500/50 min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {formData.options.map((opt, i) => (
                                <div key={i} className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Option {i + 1}</label>
                                    <input 
                                        type="text"
                                        required
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...formData.options];
                                            newOpts[i] = e.target.value;
                                            setFormData({...formData, options: newOpts});
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] text-white focus:outline-none focus:border-violet-500/50"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-8 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-500/20"
                            >
                                Commit to Bank
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default QuizManagement;
