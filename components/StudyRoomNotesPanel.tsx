import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, Textarea, Spinner } from './ui';
import { FileText, Paperclip, Trash2, Edit, Save, Download, Eye, EyeOff, Upload, Info, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface DisplayItem {
    id: string;
    title: string;
    type: 'shared-text' | 'file';
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    uploader?: string;
}

interface StudyRoomNotesPanelProps {
    sharedNoteContent: string;
    resources: any[];
    onSaveSharedNote: (content: string, version?: number) => Promise<void>;
    onUploadResource: (file: File) => void;
    onDeleteResource: (fileName: string) => void;
    isSavingNote: boolean;
    isUploading: boolean;
    lockedBy?: { userId: string, userName: string } | null;
    currentUserId?: string;
    notesVersion: number;
    onAcquireLock: () => Promise<any>;
}

const StudyRoomNotesPanel: React.FC<StudyRoomNotesPanelProps> = ({
    sharedNoteContent,
    resources,
    onSaveSharedNote,
    onUploadResource,
    onDeleteResource,
    isSavingNote,
    isUploading,
    lockedBy,
    currentUserId,
    notesVersion,
    onAcquireLock
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeItem, setActiveItem] = useState<DisplayItem | null>(null);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'conflict'>('idle');
    const [lockError, setLockError] = useState<string | null>(null);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Lock calculations
    const isLockedByMe = lockedBy?.userId === currentUserId;
    const isLockedByOther = lockedBy?.userId && !isLockedByMe;

    const displayItems: DisplayItem[] = useMemo(() => {
        const items: DisplayItem[] = [];
        items.push({
            id: 'shared-text-note',
            title: 'Shared Study Notes',
            type: 'shared-text',
            content: sharedNoteContent
        });

        resources.forEach(res => {
            if (res && res.name && res.url) {
                items.push({
                    id: res.name,
                    title: res.name,
                    type: 'file',
                    fileUrl: res.url,
                    fileName: res.name,
                    fileType: res.mimeType || 'application/octet-stream',
                    uploader: res.uploader || 'Unknown'
                });
            }
        });
        return items;
    }, [sharedNoteContent, resources]);

    useEffect(() => {
        if (!activeItem && displayItems.length > 0) {
            setActiveItem(displayItems[0]);
            setEditedContent(displayItems[0].content || '');
            setIsEditingNote(false);
        }
        else if (activeItem?.id === 'shared-text-note' && !isEditingNote) {
            setEditedContent(sharedNoteContent);
        }
        else if (activeItem && !displayItems.some(item => item.id === activeItem.id)) {
            setActiveItem(null);
            setIsEditingNote(false);
        }
    }, [sharedNoteContent, activeItem, isEditingNote, displayItems]);

    const handleSelect = (item: DisplayItem) => {
        if (isSavingNote || isUploading) return;
        setActiveItem(item);
        if (item.type === 'shared-text') {
            setEditedContent(item.content || '');
            setIsEditingNote(false);
        } else {
            setIsEditingNote(false);
        }
    };

    const performSave = useCallback(async (contentToSave: string) => {
        setSaveStatus('saving');
        try {
            await onSaveSharedNote(contentToSave, notesVersion);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err: any) {
            console.error("Save error:", err);
            if (err.response?.status === 409) {
                setSaveStatus('conflict');
            } else {
                setSaveStatus('idle');
            }
        }
    }, [onSaveSharedNote, notesVersion]);

    useEffect(() => {
        if (isEditingNote && isLockedByMe) {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            
            // Only debounce if content actually changed from what came from props
            if (editedContent !== sharedNoteContent) {
                autoSaveTimerRef.current = setTimeout(() => {
                    performSave(editedContent);
                }, 1000);
            }
        }
        return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    }, [editedContent, isEditingNote, isLockedByMe, performSave, sharedNoteContent]);

    const startEditing = async () => {
        setLockError(null);
        try {
            await onAcquireLock();
            setIsEditingNote(true);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Could not acquire lock.";
            setLockError(msg);
            setTimeout(() => setLockError(null), 3000);
        }
    };

    const handleSaveManual = () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        performSave(editedContent);
        setIsEditingNote(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUploadResource(file);
            event.target.value = '';
        }
    };

    const handleDownloadFile = (item: DisplayItem) => {
        if (item.type === 'file' && item.fileUrl) {
            const link = document.createElement('a');
            link.href = item.fileUrl;
            link.download = item.fileName || item.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="flex flex-1 overflow-hidden h-full text-sm">
            {/* --- Notes/Files List --- */}
            <div className="w-2/5 border-r border-slate-700 flex flex-col h-full bg-slate-800/50">
                <div className="p-3 border-b border-slate-700">
                    <label htmlFor="room-notes-upload" className="sr-only">Upload Room Notes</label>
                    <input id="room-notes-upload" name="notesUpload" type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />                    <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full text-xs py-2">
                        {isUploading ? <><Spinner size="sm" className="mr-2" /> Uploading...</> : <><Upload size={14} className="mr-2" /> Upload File</>}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {displayItems.length === 0 && (
                        <p className="text-center text-slate-400 p-4 text-xs">No shared notes or files.</p>
                    )}
                    {displayItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={`w-full text-left p-3 border-b border-slate-700/50 transition-colors group flex justify-between items-start cursor-pointer ${activeItem?.id === item.id ? 'bg-slate-700' : 'hover:bg-slate-600/50'}`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                                {item.type === 'shared-text'
                                    ? <FileText size={16} className="flex-shrink-0 text-slate-400" />
                                    : <Paperclip size={16} className="flex-shrink-0 text-sky-400" />
                                }
                                <div className="flex flex-col min-w-0">
                                    <span className="font-medium text-slate-200 truncate">{item.title}</span>
                                    {item.type === 'shared-text' && isLockedByOther && (
                                        <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1">
                                            <Lock size={8} /> {lockedBy?.userName} is editing
                                        </span>
                                    )}
                                </div>
                            </div>
                            {item.type === 'file' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto text-red-500 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Delete file "${item.fileName}"?`)) {
                                            onDeleteResource(item.fileName!);
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Active Item Panel --- */}
            <div className="flex-1 w-3/5 flex flex-col overflow-hidden h-full bg-slate-800">
                {activeItem ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* --- Toolbar --- */}
                        <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                            <div className="min-w-0 flex flex-col">
                                <h3 className="text-base font-semibold text-white truncate">{activeItem.title}</h3>
                                {activeItem.type === 'shared-text' && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">v{notesVersion}</span>
                                        {saveStatus === 'saving' && <span className="text-[9px] text-sky-400 font-bold flex items-center gap-1 animate-pulse"><Spinner size="xs" /> Saving...</span>}
                                        {saveStatus === 'saved' && <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"><CheckCircle size={10} /> Saved</span>}
                                        {saveStatus === 'conflict' && <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1"><AlertCircle size={10} /> Conflict: Pull Latest</span>}
                                        {lockError && <span className="text-[9px] text-rose-400 font-bold italic">{lockError}</span>}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {activeItem.type === 'file' && (
                                    <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(activeItem)} className="p-1.5 text-slate-400 hover:text-white">
                                        <Download size={16} />
                                    </Button>
                                )}
                                {activeItem.type === 'shared-text' && (
                                    isEditingNote ? (
                                        <Button onClick={handleSaveManual} isLoading={isSavingNote} size="sm" className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-500">
                                            <Save size={14} className="mr-1" /> Done
                                        </Button>
                                    ) : (
                                        isLockedByOther ? (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                                                <Lock size={12} className="text-amber-500" />
                                                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">{lockedBy?.userName} editing</span>
                                            </div>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={startEditing} className="p-1.5 text-slate-400 hover:text-white">
                                                <Edit size={16} />
                                            </Button>
                                        )
                                    )
                                )}
                            </div>
                        </div>

                        {/* --- Content Display --- */}
                        <div className="p-4 flex-1 overflow-y-auto">
                            {activeItem.type === 'shared-text' ? (
                                isEditingNote ? (
                                    <Textarea
                                        id="shared-notes-area"
                                        name="sharedNotesArea"
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full h-full min-h-[calc(100vh-250px)] p-0 bg-slate-800 border-none focus:ring-0 text-sm font-mono leading-relaxed resize-none"
                                        placeholder="Start writing shared notes..."
                                        disabled={isSavingNote}
                                    />
                                ) : (
                                    <div className="prose prose-sm prose-invert max-w-none">
                                        <ReactMarkdown>{editedContent || sharedNoteContent}</ReactMarkdown>
                                        {!editedContent && !sharedNoteContent && <p className="text-slate-400 italic">No notes. Press edit to start.</p>}
                                    </div>
                                )
                            ) : (
                                <div>
                                    {activeItem.fileType === 'application/pdf' && activeItem.fileUrl ? (
                                        <div className="mt-2">
                                            {!showPdfPreview ? (
                                                <div className="flex items-center gap-2 bg-slate-700 p-3 rounded-lg ring-1 ring-slate-600">
                                                    <FileText size={18} className="text-sky-400 flex-shrink-0" />
                                                    <span className="font-medium text-slate-200 truncate flex-1">{activeItem.fileName}</span>
                                                    <Button onClick={() => setShowPdfPreview(true)} variant="outline" size="sm" className="text-xs">
                                                        <Eye size={14} className="mr-1" /> Preview
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Button onClick={() => setShowPdfPreview(false)} variant="ghost" size="sm" className="mb-2 text-xs">
                                                        <EyeOff size={14} className="mr-1" /> Close Preview
                                                    </Button>
                                                    <div className="w-full h-[65vh] rounded-lg overflow-hidden ring-1 ring-slate-700">
                                                        <iframe src={`${activeItem.fileUrl}#view=fitH`} title={activeItem.title} width="100%" height="100%" className="border-none" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-700/50 rounded-lg mt-4 h-40 ring-1 ring-slate-600">
                                            <Info size={24} className="text-slate-400 mb-2" />
                                            <p className="font-semibold text-slate-300">Preview not available</p>
                                            <p className="text-xs text-slate-400 mt-1">Download this file to view it.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-500 text-sm">Select an item to view or edit</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyRoomNotesPanel;