import React, { useRef } from 'react';
import { Camera, Plus, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';
import { uploadNoteFile } from '../../services/notesService';
import { getCourses } from '../../services/courseService';

const SmartScanFAB: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Pick 'general' course or the first available course
            const courses = await getCourses();
            const targetCourseId = courses[0]?.id || 'general';
            
            showToast('AI Analysis Started: Scanning your notes...', 'info');
            
            await uploadNoteFile(targetCourseId, file.name, file);
            
            showToast('Sync Complete! Note added to your library.', 'success');
        } catch (error) {
            console.error('[SmartScanFAB] Upload failed:', error);
            showToast('Digitization failed. Please check your connection.', 'error');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-[100] lg:hidden">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
            />
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/40 border border-white/20 relative group overflow-hidden"
            >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="flex flex-col items-center">
                    <Camera size={24} className="text-white" />
                </div>
                
                {/* Tooltip-like label */}
                <div className="absolute -top-10 right-0 bg-slate-900 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-violet-400 whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    Scan Notes
                </div>
            </motion.button>
        </div>
    );
};

export default SmartScanFAB;
