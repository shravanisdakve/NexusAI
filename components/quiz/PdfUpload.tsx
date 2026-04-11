import React, { useState } from 'react';
import { Upload, FileText, X, Wand2, AlertCircle } from 'lucide-react';
import { Button } from '../ui';

interface PdfUploadProps {
  onFileProcessed: (base64: string, mimeType: string) => void;
  isProcessing: boolean;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ onFileProcessed, isProcessing }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localProcessing, setLocalProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 15 * 1024 * 1024) {
        setError('File size too large (max 15MB)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setLocalProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        onFileProcessed(base64, file.type);
      } catch (err: any) {
        setError(err.message || 'Failed to process file');
      } finally {
        setLocalProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setLocalProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-violet-500/20">
          <Upload className="text-violet-400" size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Build a Quiz from Your Content</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          Upload a PDF, document, or image. Our AI will analyze the text and generate a structured practice quiz for you.
        </p>

        {!file ? (
          <label className="w-full max-w-md p-8 border-2 border-dashed border-slate-800 rounded-2xl hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer flex flex-col items-center group">
            <FileText className="text-slate-600 group-hover:text-violet-400 mb-2 transition-colors" size={40} />
            <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200">
              Click to select or drag and drop
            </span>
            <span className="text-[10px] text-slate-600 mt-1">
              Supports PDF, DOCX, TXT, Images (Max 15MB)
            </span>
            <input 
              id="quiz-pdf-upload"
              name="quizPdfUpload"
              type="file" 
              className="hidden" 
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" 
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
                  <FileText className="text-violet-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={() => setFile(null)} 
                className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                disabled={localProcessing || isProcessing}
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-left animate-in fade-in zoom-in duration-300">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none shadow-xl shadow-violet-900/20 py-6 text-base"
              onClick={processFile}
              disabled={localProcessing || isProcessing}
            >
              {(localProcessing || isProcessing) ? (
                <><div className="animate-spin mr-2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> AI Analyzing Content...</>
              ) : (
                <><Wand2 size={20} className="mr-2" /> Generate AI Practice Quiz</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfUpload;
