import React, { useEffect, useState } from 'react';
import PrintableResume from '@/components/PrintableResume';

const ResumePrint: React.FC = () => {
    const [resumeData, setResumeData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load data from localStorage
        const rawData = localStorage.getItem('nexus_resume_print_data');
        if (rawData) {
            try {
                const parsed = JSON.parse(rawData);
                setResumeData(parsed);
                
                // Trigger print after a short delay to ensure rendering
                setTimeout(() => {
                    window.print();
                }, 800);
            } catch (err) {
                console.error('Failed to parse resume data:', err);
                setError('Invalid resume data format.');
            }
        } else {
            setError('No resume data found. Please go back and generate a draft first.');
        }
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold">!</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Print Error</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button 
                        onClick={() => window.close()} 
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        );
    }

    if (!resumeData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="print-root">
            <PrintableResume data={resumeData} />
            
            {/* Overlay for instructions when viewed on screen before print */}
            <div className="fixed top-4 left-4 right-4 bg-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between z-50 print:hidden animate-in slide-in-from-top-4 duration-500 opacity-90 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold italic tracking-tighter">NX</div>
                    <p className="text-sm font-medium">Generating professional PDF. <strong>Tip:</strong> Disable "Headers and Footers" in print settings.</p>
                </div>
                <button 
                    onClick={() => window.print()} 
                    className="bg-white text-indigo-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                >
                    RE-PRINT
                </button>
            </div>
        </div>
    );
};

export default ResumePrint;
