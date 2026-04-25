import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { getCourses, addCourse, importCurriculumSubjects } from '../services/courseService';
import { getNotes, addTextNote, uploadNoteFile, deleteNote, getFlashcards, addFlashcards, updateFlashcard, updateNoteContent, getQuizzes, savePersonalQuiz, updateQuizScore } from '../services/notesService';
import { getStudyPlan, saveStudyPlan, updateTaskCompletion } from '../services/studyPlanService';
import { type Note, type Course, type Flashcard as FlashcardType, type StudyPlan, type StudyTask, type PersonalQuiz } from '../types';
import { PageHeader, Button, Input, Textarea, Select, Modal, Spinner } from '../components/ui';
import PageLayout from '../components/ui/PageLayout';
import { 
  PlusCircle, Trash2, Upload, FileText, BookOpen, Layers, X, 
  Brain, Edit, Save, ArrowLeft, Download, Eye, EyeOff, 
  Calendar, Target, CheckCircle2, Circle, Users, Sparkles, 
  Zap, RefreshCw, ChevronRight, ArrowRight 
} from 'lucide-react';
import { generateFlashcards, summarizeText, extractTextFromFile, extractTextFromUrl, generateStudyPlan, generateQuizSet, parseStudyPlanPayload } from '../services/geminiService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Flashcard from '../components/Flashcard';
import EmptyState from '../components/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';


// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (!result || !result.includes(',')) {
        return reject(new Error("Invalid file data for base64 conversion"));
      }
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};




const Notes: React.FC = () => {

  const navigate = useNavigate();
  const { user } = useAuth();

  // --- State Management ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [quizzes, setQuizzes] = useState<PersonalQuiz[]>([]); // New state
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);

  const [activeTab, setActiveTab] = useState<'notes' | 'flashcards' | 'plan' | 'quiz'>('notes'); // Added 'quiz'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // Loading state for note-based generation
  const [isQuizGenerating, setIsQuizGenerating] = useState(false); // New loading state for quiz
  const [isFileGenerating, setIsFileGenerating] = useState(false); // Loading state for file-based generation
  const [isSummarizing, setIsSummarizing] = useState(false); // New state for summarization
  const [isSingleGenerating, setIsSingleGenerating] = useState<string | null>(null); // Track which note ID is generating
  const [aiInquiry, setAiInquiry] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isGroundingActive, setIsGroundingActive] = useState(false);
  const [groundingSource, setGroundingSource] = useState<string | null>(null);
  const [isGroundingLoading, setIsGroundingLoading] = useState(false);

  const location = useLocation();
  const initRef = useRef(false);

  useEffect(() => {
    if (location.state?.course) {
      setSelectedCourse(location.state.course);
    }
  }, []); // ← empty array = runs only once on mount


  // --- Data Fetching Effects ---
  useEffect(() => {
    if (user) {
      console.log("[Notes] Fetching courses for user:", user);
      getCourses()
        .then(fetchedCourses => {
          console.log(`[Notes] Successfully fetched ${fetchedCourses.length} courses`);
          setCourses(fetchedCourses);
        })
        .catch(error => {
          console.error("[Notes] Error fetching courses:", error);
          // Don't show alert here as it might be annoying on every page load
          // User will see error when trying to add a course instead
        });
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      setActiveNote(null);
      setIsEditingNote(false);
      getNotes(selectedCourse).then(setNotes);
      getFlashcards(selectedCourse).then(setFlashcards);
      getQuizzes(selectedCourse).then(setQuizzes);
      getStudyPlan(selectedCourse).then(setStudyPlan);
    } else {
      setNotes([]);
      setFlashcards([]);
      setQuizzes([]);
      setStudyPlan(null);
      setActiveNote(null);
      setAiResponse(null);
      setAiInquiry('');
    }

  }, [selectedCourse]);

  // Clean AI response when changing active note
  useEffect(() => {
    setAiResponse(null);
    setAiInquiry('');
  }, [activeNote?.id]);

  // Handle automatic RAG grounding when notes change
  useEffect(() => {
    if (notes.length > 0) {
        const syllabusNote = notes.find(n => n.title.includes("Syllabus Context"));
        if (syllabusNote && syllabusNote.content && !groundingSource) {
            console.log(`[RAG-Auto] Grounding AI with existing syllabus note: ${syllabusNote.title}`);
            setGroundingSource(syllabusNote.content);
            setIsGroundingActive(true);
        } else if (!syllabusNote) {
            setGroundingSource(null);
            setIsGroundingActive(false);
        }
    } else {
        setGroundingSource(null);
        setIsGroundingActive(false);
    }
  }, [notes, selectedCourse]);

  // --- Handlers ---
  const handlePersonalizeWorkspace = async () => {
    if (!user?.branch || isImporting) {
        showToast("Please update your branch in profile settings first!", "info");
        return;
    }

    setIsImporting(true);
    const loadingToast = showToast("Syncing with MU Curriculum...", "info");
    
    try {
        // Map user.year (1-4) to a default semester if semester isn't explicit
        const sem = user.semester ? parseInt(user.semester) : (user.year ? (user.year * 2 - 1) : 1);
        
        const newCourses = await importCurriculumSubjects(user.branch, sem);
        
        if (newCourses.length > 0) {
            setCourses(prev => [...prev, ...newCourses]);
            showToast(`Success! Imported ${newCourses.length} subjects for ${user.branch} Sem ${sem}.`, "success");
            if (newCourses[0]) setSelectedCourse(newCourses[0].id);
        } else {
            showToast("No new subjects found for your current profile. You can still add them manually!", "info");
        }
    } catch (error) {
        console.error("Personalization failed:", error);
        showToast("Failed to fetch curriculum. Please check your branch details.", "error");
    } finally {
        setIsImporting(false);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    
    // Duplicate check
    const exists = courses.some(c => c.name.toLowerCase() === newCourseName.trim().toLowerCase());
    if (exists) {
      showToast(`Course "${newCourseName}" already exists!`, 'error');
      return;
    }

    setIsSubmittingCourse(true);
    try {
      const newCourse = await addCourse(newCourseName.trim());
      if (newCourse) {
        setCourses(prev => [...prev, newCourse]);
        setSelectedCourse(newCourse.id);
        setIsAddCourseModalOpen(false);
        setNewCourseName('');
        // Post-creation 'Success Bridge' logic
        showToast(`"${newCourseName}" is ready! Select a tool to begin. 🚀`, 'success');
        setActiveTab('notes');
        setIsModalOpen(true); // Open the "Add Note" modal immediately for the user
      }
    } catch (error) {
      showToast('Failed to add course.', 'error');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const reloadNotes = (newNoteId?: string) => {
    if (selectedCourse) {
      getNotes(selectedCourse).then(fetchedNotes => {
        setNotes(fetchedNotes);
        if (newNoteId) {
          const noteToSelect = fetchedNotes.find(n => n.id === newNoteId);
          if (noteToSelect) {
            handleSelectNote(noteToSelect);
          }
        }
      });
    }
  };
  const reloadFlashcards = () => {
    if (selectedCourse) {
      getFlashcards(selectedCourse).then(setFlashcards);
    }
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setEditedContent(note.content || '');
    setIsEditingNote(false);
  };

  // --- FIX: Updated function signature (no 'e' or 'noteId') ---
  const handleDeleteNote = async (noteToDelete: Note) => {
    if (!selectedCourse) return;

    if (noteToDelete) {
      try {
        await deleteNote(selectedCourse, noteToDelete);
        showToast("Note successfully removed from your library.", 'success');
        reloadNotes();
        if (activeNote?.id === noteToDelete.id) {
          setActiveNote(null);
        }
      } catch (error) {
        showToast("We encountered an issue while deleting that note.", 'error');
      }
    }
  };
  // --- END FIX ---

  const handleSaveNoteEdit = async () => {
    if (!activeNote || !selectedCourse) return;

    try {
      await updateNoteContent(selectedCourse, activeNote.id, editedContent);
      console.log("Saved note:", activeNote.id, "with content:", editedContent);
      setActiveNote(prev => prev ? { ...prev, content: editedContent } : null);
      setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, content: editedContent } : n));
      setIsEditingNote(false);
    } catch (error) {
      console.error("Failed to save note edit:", error);
      showToast("Unable to save your changes. Please check your connection.", 'error');
    }
  };

  const handleSummarizeNote = async () => {
    if (!activeNote?.content || activeNote.content === "[Text extraction pending or failed]" || isSummarizing) return;

    setIsSummarizing(true);
    setAiResponse(null);
    try {
      console.log(`Summarizing note '${activeNote.title}' (length: ${activeNote.content.length})`);
      const summary = await summarizeText(activeNote.content, language);
      setAiResponse(summary);
      showToast("Summary generated successfully!", 'success');
    } catch (error) {
      console.error("Failed to summarize note:", error);
      showToast("Failed to generate summary. Please try again.", 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateFromNotes = async () => {
    if (!selectedCourse || notes.length === 0 || isGenerating || isFileGenerating || isSingleGenerating) return;

    setIsGenerating(true);
    const validNotesContent = notes
      .filter(n => n.content && n.content !== "[Text extraction pending or failed]")
      .map(n => n.content);

    if (validNotesContent.length === 0) {
      showToast("No text content found in your notes to generate flashcards from.", 'info');
      setIsGenerating(false);
      return;
    }
    const content = validNotesContent.join('\n\n');

    try {
      console.log("Generating flashcards from combined notes content length:", content.length);
      const flashcardsJson = await generateFlashcards(content, language);
      const parsedData = JSON.parse(flashcardsJson);
      const flashcardsArray = Array.isArray(parsedData) ? parsedData : (parsedData.flashcards || []);

      if (flashcardsArray.length === 0) {
        showToast("The AI couldn't generate any flashcards from these notes. Try adding more detailed content!", 'info');
        setIsGenerating(false);
        return;
      }

      const newFlashcards = flashcardsArray.map((f: any) => ({
        ...f,
        id: `mock_flashcard_${Date.now()}_${Math.random()}`,
        bucket: 1,
        lastReview: Date.now()
      }));

      await addFlashcards(selectedCourse, newFlashcards);
      reloadFlashcards();
      showToast(`Successfully generated ${newFlashcards.length} flashcards from notes!`, 'success');
    } catch (error) {
      console.error("Failed to generate or parse flashcards from notes:", error);
      showToast("Failed to generate flashcards from notes. Please try again.", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromFile = async (file: File | null) => {
    if (!file || !selectedCourse || isGenerating || isFileGenerating || isSingleGenerating) return;

    setIsFileGenerating(true);
    let extractedContent = '';
    try {
      const base64Data = await fileToBase64(file);

      let mimeType = file.type;
      if (!mimeType) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const mimeMap: { [key: string]: string } = {
          'pdf': 'application/pdf',
          'txt': 'text/plain',
          'md': 'text/plain',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'ppt': 'application/vnd.ms-powerpoint'
        };
        mimeType = mimeMap[extension || ''] || 'application/octet-stream';
      }

      extractedContent = await extractTextFromFile(base64Data, mimeType);
      console.log(`Extracted ${extractedContent.length} characters from ${file.name}`);

      if (!extractedContent || extractedContent.trim().length === 0) {
        showToast(`Could not extract any text from ${file.name}. Flashcard generation cancelled.`, 'error');
        setIsFileGenerating(false);
        return;
      }

      console.log(`Generating flashcards from extracted text (length: ${extractedContent.length})`);
      const flashcardsJson = await generateFlashcards(extractedContent, language);
      const parsedData = JSON.parse(flashcardsJson);
      const flashcardsArray = Array.isArray(parsedData) ? parsedData : (parsedData.flashcards || []);
      
      if (flashcardsArray.length === 0) {
        showToast(`The AI couldn't generate any flashcards from the file ${file.name}.`, 'info');
        setIsFileGenerating(false);
        return;
      }

      const newFlashcards = flashcardsArray.map((f: any) => ({
        ...f,
        id: `mock_flashcard_${Date.now()}_${Math.random()}`,
        bucket: 1,
        lastReview: Date.now()
      }));

      await addFlashcards(selectedCourse, newFlashcards);
      reloadFlashcards();
      showToast(`Successfully generated ${newFlashcards.length} flashcards from the file ${file.name}!`, 'success');

    } catch (error) {
      console.error(`Failed process file ${file.name} for flashcards:`, error);
      showToast(`Failed to generate flashcards from the file ${file.name}.`, 'error');
    } finally {
      setIsFileGenerating(false);
    }
  };

  // --- FIX: Updated function signature (no 'e') ---
  const handleGenerateSingleNoteFlashcards = async (note: Note) => {
    if (!note.content || note.content === "[Text extraction pending or failed]" || !selectedCourse || isGenerating || isFileGenerating || isSingleGenerating) {
      showToast("This note doesn't have any text content to generate flashcards from.", 'info');
      return;
    }

    setIsSingleGenerating(note.id);
    try {
      console.log(`Generating flashcards from single note '${note.title}' (length: ${note.content.length})`);
      const flashcardsJson = await generateFlashcards(note.content, language);
      const parsedData = JSON.parse(flashcardsJson);
      const flashcardsArray = Array.isArray(parsedData) ? parsedData : (parsedData.flashcards || []);

      if (flashcardsArray.length === 0) {
        showToast(`The AI couldn't generate any flashcards from the note '${note.title}'.`, 'info');
        setIsSingleGenerating(null);
        return;
      }

      const newFlashcards = flashcardsArray.map((f: any) => ({
        ...f,
        id: `mock_flashcard_${Date.now()}_${Math.random()}`,
        bucket: 1,
        lastReview: Date.now()
      }));

      await addFlashcards(selectedCourse, newFlashcards);
      reloadFlashcards();
      showToast(`Successfully generated ${newFlashcards.length} flashcards from the note '${note.title}'!`, 'success');
      setActiveTab('flashcards'); // Switch to flashcards tab after generation

    } catch (error) {
      console.error(`Failed to generate flashcards from note ${note.id}:`, error);
      showToast(`Failed to generate flashcards from the note '${note.title}'.`, 'error');
    } finally {
      setIsSingleGenerating(null);
    }
  };
  // --- END FIX ---

  const handleGenerateQuiz = async () => {
    if (!selectedCourse || notes.length === 0 || isQuizGenerating) return;

    setIsQuizGenerating(true);
    const validNotesContent = notes
      .filter(n => n.content && n.content !== "[Text extraction pending or failed]")
      .map(n => n.content);

    if (validNotesContent.length === 0) {
      showToast("No text content found in your notes to generate a quiz from.", 'info');
      setIsQuizGenerating(false);
      return;
    }
    const content = validNotesContent.join('\n\n');

    try {
      console.log("Generating quiz from notes...");
      const quizJson = await generateQuizSet(content, 5, language);
      const parsedData = JSON.parse(quizJson);
      const questionSet = Array.isArray(parsedData) ? parsedData : (parsedData.questions || parsedData.quiz || []);

      const newQuiz: PersonalQuiz = {
        id: `quiz_${Date.now()}`,
        questions: questionSet,
        score: 0,
        completed: false,
        dateTaken: Date.now()
      };

      // Save to backend
      await savePersonalQuiz(selectedCourse, newQuiz);
      setQuizzes(prev => [newQuiz, ...prev]);
      setActiveTab('quiz'); // Switch to quiz tab
      showToast(`Successfully generated a quiz with ${questionSet.length} questions!`, 'success');

    } catch (error) {
      console.error("Failed to generate quiz:", error);
      showToast("Failed to generate quiz. Please try again.", 'error');
    } finally {
      setIsQuizGenerating(false);
    }
  };

  const onUpdateQuizScore = (quizId: string, score: number) => {
    setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, score, completed: true } : q));
    updateQuizScore(selectedCourse, quizId, score);
  };


  const handleAiInquiry = async () => {
    if (!aiInquiry.trim() || (!activeNote?.content && !groundingSource) || isAILoading) return;
    
    setIsAILoading(true);
    setAiResponse(null);
    try {
        const contextPrefix = isGroundingActive && groundingSource 
            ? `[OFFICIAL CURRICULUM CONTEXT]:\n${groundingSource}\n\n[USER NOTE CONTEXT]:\n`
            : `[NOTE CONTEXT]:\n`;

        const fullContext = contextPrefix + (activeNote?.content || "");
        const response = await generateFlashcards(`Question: ${aiInquiry}\n\nContext: ${fullContext}`, language);
        
        const parsed = JSON.parse(response);
        setAiResponse(Array.isArray(parsed) ? parsed[0]?.front : (parsed.flashcards?.[0]?.front || "Result analyzed. Check note context."));
    } catch (e) {
        setAiResponse("Intelligence sync interrupted. Verify grounding sources and try again.");
    } finally {
        setIsAILoading(false);
    }
  };

  const handleIngestSyllabus = async () => {
    if (!user?.branch || isGroundingLoading) return;
    
    setIsGroundingLoading(true);
    showToast(`Discovering Rev-2024 syllabus for ${user.branch}...`, "info");
    
    try {
        // In a real production RAG, we'd have a mapping of official MU links.
        // For this implementation, we use a known high-quality source for MU PDFs
        const mockUrlMapping: Record<string, string> = {
            'Computer Engineering': 'https://mu.ac.in/wp-content/uploads/2019/10/4.52-Computer-Engineering.pdf',
            'Information Technology': 'https://mu.ac.in/wp-content/uploads/2019/10/4.33-Information-Technology.pdf',
            'Data Science': 'https://mu.ac.in/wp-content/uploads/2021/08/4.29-B.E.-Data-Science.pdf'
        };

        const syllabusUrl = mockUrlMapping[user.branch] || 'https://mu.ac.in/wp-content/uploads/2019/10/4.52-Computer-Engineering.pdf';
        
        const text = await extractTextFromUrl(syllabusUrl);
        setGroundingSource(text);
        setIsGroundingActive(true);

        // Save as a persistent Note if a course is selected
        if (selectedCourse) {
            try {
                const newNote = await addTextNote(selectedCourse, "Official Syllabus Context (MU)", text);
                setNotes(prev => [newNote, ...prev]);
                setActiveNote(newNote);
                setEditedContent(text);
                setIsEditingNote(false);
            } catch (noteErr) {
                console.warn("Could not persist syllabus note, keeping in-memory only:", noteErr);
            }
        }

        showToast("Intelligence Core Grounded & Persisted! 🎓", "success");
    } catch (e) {
        console.error("RAG Grounding failed:", e);
        showToast("PDF Discovery failed. Try manual upload in Notes.", "error");
    } finally {
        setIsGroundingLoading(false);
    }
  };

  // --- Main Render Logic ---
  const MainContent = (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {selectedCourse ? (
        <div className="flex-1 flex flex-col bg-slate-800/50 rounded-xl ring-1 ring-slate-700 overflow-hidden">
          {/* --- Content Area --- */}
              {activeTab === 'notes' && (
                <NotesView
                  notes={notes}
                  activeNote={activeNote}
                  isEditingNote={isEditingNote}
                  editedContent={editedContent}
                  isSingleGenerating={isSingleGenerating}
                  isSummarizing={isSummarizing}
                  onSelectNote={handleSelectNote}
                  onDeleteNote={handleDeleteNote}
                  onSaveEdit={handleSaveNoteEdit}
                  onEditClick={() => setIsEditingNote(true)}
                  onContentChange={setEditedContent}
                  onAddNoteClick={() => setIsModalOpen(true)}
                  onGenerateSingleNoteFlashcards={handleGenerateSingleNoteFlashcards}
                  onSummarizeNote={handleSummarizeNote}
                />
              )}

          {activeTab === 'flashcards' && (
            <FlashcardsView
              flashcards={flashcards}
              onGenerateFromNotes={handleGenerateFromNotes}
              onGenerateFromFile={handleGenerateFromFile}
              isGenerating={isGenerating}
              isFileGenerating={isFileGenerating}
              courseId={selectedCourse}
              notes={notes}
              onUpdateCard={async (card, correct) => {
                const newBucket = correct ? Math.min(card.bucket + 1, 4) : 1;
                await updateFlashcard(selectedCourse, card.id, { bucket: newBucket, lastReview: Date.now() });
                reloadFlashcards();
              }}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizView
              quizzes={quizzes}
              onGenerateQuiz={handleGenerateQuiz}
              isGenerating={isQuizGenerating}
              onUpdateScore={onUpdateQuizScore}
              notes={notes}
            />
          )}

          {activeTab === 'plan' && (
            <StudyPlanView
              courseId={selectedCourse}
              courseName={courses.find(c => c.id === selectedCourse)?.name || 'this course'}
              notes={notes}
              studyPlan={studyPlan}
              onPlanSaved={setStudyPlan}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-white/[0.04] p-12 relative overflow-hidden group">
          {/* Ghost Arrow - Guidance Animation */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-700 pointer-events-none hidden xl:block">
            <div className="flex flex-col items-center gap-2">
              <div className="text-[8px] font-black uppercase text-violet-500 tracking-[0.3em] rotate-90 mb-6 whitespace-nowrap italic">Begin Navigation</div>
              <motion.div 
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                 <ArrowRight size={32} className="text-violet-500/40" />
              </motion.div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              key="empty-workspace"
              className="max-w-md text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-white/5 flex items-center justify-center mx-auto mb-4 shadow-2xl relative shadow-violet-900/10">
                  <BookOpen className="w-7 h-7 text-slate-700" />
                  <div className="absolute inset-0 bg-violet-600/5 blur-2xl rounded-full" />
              </div>
              
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2 leading-tight">Workspace Entry Pending</h3>
              <p className="text-slate-500 mb-6 text-[10px] font-bold leading-relaxed uppercase tracking-[0.3em] italic max-w-xs mx-auto opacity-60">
                Select a course from the right panel or create a new one to start.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button 
                    variant="ghost" 
                    className="h-10 px-6 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 text-[8px] font-black uppercase tracking-[0.2em] rounded-2xl"
                    disabled={isImporting}
                    onClick={handlePersonalizeWorkspace}
                >
                  {isImporting ? <RefreshCw size={12} className="mr-2 animate-spin" /> : <Sparkles size={12} className="mr-2 text-violet-400" />}
                  Personalize My Workspace
                </Button>
                <Button 
                    className="h-10 px-6 bg-violet-600 hover:bg-violet-500 text-white shadow-2xl shadow-violet-900/20 text-[8px] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all"
                    onClick={() => setIsAddCourseModalOpen(true)}
                >
                  <PlusCircle size={12} className="mr-2" /> New Course
                </Button>
              </div>

              <div className="mt-16 flex flex-wrap justify-center gap-3 opacity-20 group-hover:opacity-50 transition-all duration-1000">
                {[
                  "AI Flashcards",
                  "MU Curriculum Sync",
                  "Personalized Quizzes"
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-900/40 rounded-full border border-white/5">
                    <div className="w-1 h-1 rounded-full bg-violet-500/40" /> {tip}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  const SideContent = (
    <div className="space-y-6">
      {/* --- JOURNEY PROGRESS (Guided Flow) --- */}
      <div className="p-2 bg-slate-900/40 rounded-xl border border-white/[0.06] relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Target size={12} className="text-violet-500" />
          <p className="text-[9px] font-black text-white italic uppercase tracking-[0.2em]">Journey</p>
        </div>
        <div className="flex items-center gap-1">
          {[
            { id: 1, label: 'Nav', active: !!selectedCourse },
            { id: 2, label: 'Feed', active: notes.length > 0 },
            { id: 3, label: 'Sync', active: flashcards.length > 0 || studyPlan }
          ].map((step, i, arr) => (
            <React.Fragment key={step.id}>
              <div className={`
                flex-1 h-6 rounded-lg flex items-center justify-center text-[7px] font-black uppercase tracking-tighter transition-all italic border
                ${step.active 
                  ? 'bg-violet-600/20 border-violet-500/30 text-violet-300' 
                  : 'bg-slate-950/40 border-white/[0.04] text-slate-700'}
              `}>
                {step.active && <CheckCircle2 size={10} className="mr-1 text-violet-400" />}
                {step.label}
              </div>
              {i < arr.length - 1 && <ArrowRight size={10} className="text-slate-800 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* 1. CUSTOM COURSE NAVIGATOR */}
      <div className="p-2 bg-slate-900/40 rounded-xl border border-white/[0.06] flex flex-col h-[160px]">
        <div className="flex items-center justify-between mb-1.5 shrink-0 px-1 pt-0.5">
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">Navigator</p>
          <button 
            onClick={() => setIsAddCourseModalOpen(true)} 
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white transition-all group"
            title="Create Course"
          >
            <PlusCircle size={12} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div id="course-navigator-list" className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar transition-all duration-500 rounded-lg">
          {courses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
               <BookOpen className="w-8 h-8 text-slate-800 mb-3" />
               <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">No courses tracked</p>
            </div>
          ) : (
            courses.map(course => (
                <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter transition-all relative overflow-hidden group
                        ${selectedCourse === course.id
                            ? 'bg-violet-600/10 border-violet-500/20 text-white shadow-lg'
                            : 'bg-slate-950/40 border-white/[0.03] text-slate-500 hover:text-slate-300 hover:border-white/10 hover:bg-slate-950/60'}
                    `}
                >
                    {selectedCourse === course.id && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    )}
                    <span className={`shrink-0 ${selectedCourse === course.id ? 'text-violet-400' : 'text-slate-800'}`}>
                        <FileText size={14} />
                    </span>
                    <span className="flex-1 text-left truncate italic tracking-tight">{course.name}</span>
                    {selectedCourse === course.id && <ChevronRight size={10} className="text-violet-500/40" />}
                </button>
            ))
          )}
        </div>
      </div>

      {/* 2. CONTEXTUAL PANEL (WORKSPACE vs INTELLIGENCE) */}
      {!activeNote ? (
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/[0.06]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">Global Toolbox</p>
          <div className="flex flex-col gap-1.5">
            {[
              { id: 'notes', label: 'My Notes', icon: FileText, status: notes.length > 0 ? `${notes.length}` : 'Empty' },
              { id: 'flashcards', label: 'Flashcards', icon: Layers, status: flashcards.length > 0 ? `${flashcards.length}` : (notes.length === 0 ? '🔒 Feed' : '🔄 Sync') },
              { id: 'quiz', label: 'Knowledge Quiz', icon: Brain, status: quizzes.length > 0 ? 'Done' : (notes.length === 0 ? '🔒 Feed' : '🔄 Sync') },
              { id: 'plan', label: 'Evolution Plan', icon: Calendar, status: studyPlan ? 'Live' : 'New' },
            ].map(tab => {
              const isDisabled = !selectedCourse;
              const subLabel = !selectedCourse ? 'Locked' : tab.status;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all border group italic ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white border-violet-500 shadow-xl'
                      : 'text-slate-600 border-transparent hover:bg-white/5 hover:text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed'
                  }`}
                >
                  <tab.icon size={12} className={activeTab === tab.id ? 'text-white' : 'text-slate-800 group-hover:text-violet-400'} />
                  <span className="flex-1 text-left tracking-tight">{tab.label}</span>
                  <span className={`text-[7px] px-1.5 py-0.5 rounded-full border italic ${
                    activeTab === tab.id 
                      ? 'bg-white/20 border-white/10 text-white' 
                      : 'bg-black/20 border-white/5 text-slate-800'
                  }`}>
                      {subLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-violet-600/10 rounded-xl border border-violet-500/20 relative overflow-hidden group">
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-50" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-violet-400 animate-pulse" />
              <p className="text-[9px] font-black text-violet-400 uppercase tracking-[0.2em] italic">Intelligence</p>
            </div>
            
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 leading-relaxed italic truncate">
                Context: <span className="text-white">{activeNote.title}</span>
            </p>

            {/* AI Inquiry Box */}
            <div className="mb-4 space-y-2">
                {/* RAG Grounding Toggle */}
                <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isGroundingActive ? 'bg-emerald-500 shadow-[0_0_8px_emerald]' : 'bg-slate-700'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isGroundingActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {isGroundingActive ? 'Grounding Active' : 'RAG Standby'}
                        </span>
                    </div>
                    {groundingSource ? (
                        <button 
                            onClick={() => setIsGroundingActive(!isGroundingActive)}
                            className="text-[8px] font-bold text-violet-400 hover:text-white uppercase tracking-tighter"
                        >
                            {isGroundingActive ? '[ Disconnect ]' : '[ Link ]'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleIngestSyllabus}
                            className="text-[8px] font-bold text-slate-500 hover:text-violet-400 uppercase tracking-tighter"
                            disabled={isGroundingLoading}
                        >
                            {isGroundingLoading ? 'Discovering...' : 'Fetch Syllabus'}
                        </button>
                    )}
                </div>

                <div className="relative">
                    <Textarea 
                       value={aiInquiry}
                       onChange={e => setAiInquiry(e.target.value)}
                       placeholder={isGroundingActive ? "Ask within syllabus context..." : "Query active note..."}
                       className="bg-slate-950/80 border-white/5 text-[10px] font-bold italic h-20 placeholder:text-slate-800 focus:ring-violet-500/50 pt-2"
                       onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAiInquiry()}
                    />
                    <button 
                        onClick={handleAiInquiry}
                        disabled={!aiInquiry.trim() || isAILoading}
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-all disabled:opacity-20"
                    >
                        {isAILoading ? <RefreshCw size={11} className="animate-spin" /> : <ArrowRight size={12} />}
                    </button>
                </div>
                
                {aiResponse && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-950 border border-violet-500/10 rounded-xl text-[10px] font-bold text-slate-300 leading-relaxed italic shadow-2xl relative"
                  >
                     <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                     {aiResponse}
                  </motion.div>
                )}
            </div>

            <div className="space-y-1.5">
                <Button 
                    onClick={() => handleGenerateSingleNoteFlashcards(activeNote)}
                    disabled={isSingleGenerating === activeNote.id}
                    className="w-full h-8.5 bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest italic hover:bg-violet-600 hover:text-white transition-all"
                >
                    {isSingleGenerating === activeNote.id ? <RefreshCw size={11} className="animate-spin mr-2" /> : <Layers size={13} className="mr-2" />}
                    Generate Flashcards
                </Button>
                <Button 
                    onClick={handleGenerateQuiz}
                    disabled={isQuizGenerating}
                    className="w-full h-8.5 bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest italic hover:bg-emerald-600 hover:text-white transition-all"
                >
                    {isQuizGenerating ? <RefreshCw size={11} className="animate-spin mr-2" /> : <Zap size={13} className="mr-2" />}
                    Create Knowledge Probe
                </Button>
                <Button 
                   onClick={handleSummarizeNote}
                   disabled={isSummarizing || !activeNote.content}
                   className="w-full h-8 bg-transparent text-[8px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400"
                >
                    {isSummarizing ? <RefreshCw size={11} className="mr-2 animate-spin" /> : <FileText size={11} className="mr-2" />} 
                    Context Summary
                </Button>
            </div>
            
            <button 
                onClick={() => setActiveNote(null)}
                className="mt-8 text-[8px] font-black text-slate-700 uppercase tracking-widest hover:text-rose-500 transition-colors block mx-auto italic"
            >
                [ Resume Navigator ]
            </button>
          </div>
        </div>
      )}

      {/* 3. CONTEXTUAL ACTIONS (Global) */}
      {!activeNote && selectedCourse && (
        <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Command Center</p>
          <div className="space-y-2">
            {activeTab === 'notes' && (
              <Button onClick={() => setIsModalOpen(true)} className="w-full h-10 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest italic">
                <PlusCircle size={14} className="mr-2" /> New Entry
              </Button>
            )}
            {activeTab === 'flashcards' && (
              <Button 
                onClick={handleGenerateFromNotes} 
                disabled={isGenerating || notes.length === 0}
                className="w-full h-10 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest italic"
              >
                {isGenerating ? <RefreshCw className="animate-spin mr-2" size={14} /> : <Sparkles className="mr-2" size={14} />}
                Sync Flashcards
              </Button>
            )}
            {activeTab === 'quiz' && (
              <Button 
                onClick={handleGenerateQuiz} 
                disabled={isQuizGenerating || notes.length === 0}
                className="w-full h-10 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest italic"
              >
                {isQuizGenerating ? <RefreshCw className="animate-spin mr-2" size={14} /> : <Zap className="mr-2" size={14} />}
                Generate Quiz
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageLayout 
        main={MainContent}
        side={SideContent}
      />

      <Modal 
        isOpen={isAddCourseModalOpen} 
        onClose={() => setIsAddCourseModalOpen(false)}
        title="Create New Course"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="course-name-input" className="block text-sm font-medium text-slate-300 mb-1">
              Course Name
            </label>
            <Input 
              id="course-name-input"
              name="courseName"
              value={newCourseName}
              onChange={e => setNewCourseName(e.target.value)}
              placeholder="e.g. Data Structures, Calculus III"
              autoFocus
              className="bg-slate-950/80 border-white/10 text-white focus:ring-2 focus:ring-violet-500/50 transition-all h-12"
              onKeyDown={e => e.key === 'Enter' && handleAddCourse()}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" className="text-slate-500 hover:text-white" onClick={() => setIsAddCourseModalOpen(false)} disabled={isSubmittingCourse}>
              Cancel
            </Button>
            <Button 
                onClick={handleAddCourse} 
                isLoading={isSubmittingCourse} 
                className={`px-8 transition-all ${newCourseName.trim() ? 'bg-violet-600 active-glow shadow-violet-600/20' : 'bg-slate-800'}`}
                disabled={!newCourseName.trim()}
            >
              + Create Course
            </Button>
          </div>
        </div>
      </Modal>

      <AddNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={selectedCourse}
        onNoteAdded={reloadNotes}
      />
    </>
  );
};

// --- TabButton Component ---
const TabButton: React.FC<{ icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-colors ${isActive
      ? 'text-violet-400 border-b-2 border-violet-400'
      : 'text-slate-400 hover:text-white'
      }`}
  >
    <Icon size={18} /> {label}
  </button>
);

// --- NotesView Sub-Component ---
const NotesView: React.FC<{
  notes: Note[];
  activeNote: Note | null;
  isEditingNote: boolean;
  editedContent: string;
  isSingleGenerating: string | null;
  isSummarizing: boolean;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onSaveEdit: (note: Note) => void;
  onEditClick: () => void;
  onContentChange: (content: string) => void;
  onAddNoteClick: () => void;
  onGenerateSingleNoteFlashcards: (note: Note) => void;
  onSummarizeNote: () => void;
}> = ({
  notes,
  activeNote,
  isEditingNote,
  editedContent,
  isSingleGenerating,
  isSummarizing,
  onSelectNote,
  onDeleteNote,
  onSaveEdit,
  onEditClick,
  onContentChange,
  onAddNoteClick,
  onGenerateSingleNoteFlashcards,
  onSummarizeNote
}) => {
    const navigate = useNavigate();

    const handleDownloadFile = (note: Note) => {
      if ((note.type === 'file' || note.fileUrl) && note.fileUrl) { // Check for fileUrl
        const link = document.createElement('a');
        link.href = note.fileUrl;
        link.download = note.fileName || (note.title.endsWith(note.fileExtension || '') ? note.title : `${note.title}.${note.fileExtension || 'txt'} `);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (note.type === 'text') {
        const blob = new Blob([note.content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${note.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    return (
      <div className="flex flex-1 overflow-hidden">
        {/* --- Notes List --- */}
        <div className="w-[380px] border-r border-white/[0.04] flex flex-col bg-slate-900/40 relative">
          <div className="p-5 border-b border-white/[0.04] sticky top-0 bg-slate-900/80 backdrop-blur-xl z-20 flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Document Feed</h4>
            <Button onClick={onAddNoteClick} className="h-8 px-4 bg-violet-600 text-[9px] font-black uppercase tracking-widest italic rounded-lg shadow-lg shadow-violet-900/20 active:scale-95 transition-all">
              <PlusCircle size={12} className="mr-2" /> Add Entry
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {notes.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center opacity-40">
                <FileText size={40} className="text-slate-800 mb-4" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-loose">Feed is currently<br/>empty</p>
              </div>
            )}
            {notes.map(note => {
              const isGeneratingThis = isSingleGenerating === note.id;
              const hasContent = note.content && note.content !== "[Text extraction pending or failed]";
              const isActive = activeNote?.id === note.id;
              
              // Icon based on type
              const isFile = !!note.fileUrl || note.type === 'file';
              
              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`
                    w-full px-5 py-4 border-b border-white/[0.02] transition-all group flex justify-between items-center cursor-pointer relative overflow-hidden
                    ${isActive ? 'bg-violet-600/[0.07]' : 'hover:bg-white/[0.02]'}
                  `}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectNote(note)}
                >
                  {isActive && <div className="absolute left-0 inset-y-0 w-0.5 bg-violet-500 shadow-[0_0_10px_#8b5cf6]" />}
                  
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all
                      ${isFile ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}
                      ${isActive ? 'ring-2 ring-violet-500/20' : ''}
                    `}>
                      {isFile ? <Upload size={14} /> : <FileText size={14} />}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className={`text-[11px] font-black uppercase tracking-tight truncate italic ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {note.title}
                      </h4>
                      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 italic">
                        {isFile ? 'Document Resource' : 'Captured Thought'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-violet-400 hover:bg-violet-600 hover:text-white transition-all shadow-sm"
                        title="Quick Flashcards"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateSingleNoteFlashcards(note);
                        }}
                        disabled={isGeneratingThis || !!isSingleGenerating}
                      >
                        {isGeneratingThis ? <Spinner size="sm" /> : <Layers size={13} />}
                      </button>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-600 hover:bg-red-600 hover:text-white transition-all"
                      title="Clear Entry"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note);
                      }}
                      disabled={isGeneratingThis || !!isSingleGenerating}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* --- Active Note Panel --- */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeNote ? (
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
              {/* --- Toolbar --- */}
              <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800 sticky top-0 z-10">
                <h3 className="text-lg font-semibold text-white truncate">{activeNote.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">

                  {/* --- Summarize Button --- */}
                  <Button
                    onClick={onSummarizeNote}
                    disabled={isSummarizing || !activeNote.content || activeNote.content === "[Text extraction pending or failed]"}
                    className="p-2 text-slate-400 hover:text-violet-400 transition-colors"
                    aria-label="Summarize Note"
                    title="Summarize Note"
                  >
                    {isSummarizing ? <Spinner size={16} /> : <Sparkles size={16} />}
                  </Button>

                  {/* --- Generate Flashcards Button (as requested) --- */}
                  <Button
                    onClick={() => onGenerateSingleNoteFlashcards(activeNote)}
                    disabled={isSingleGenerating === activeNote.id || (activeNote.type === 'text' && !activeNote.content) || (!activeNote.content)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    aria-label="Generate Flashcards"
                    title="Generate Flashcards"
                  >
                    {isSingleGenerating === activeNote.id ? <Spinner size={16} /> : <Layers size={16} />}
                  </Button>

                  {/* --- Study with AI Button --- */}
                  {activeNote.content && activeNote.content !== "[Text extraction pending or failed]" && (
                    <Button
                      onClick={() => navigate('/tutor', { state: { noteContent: activeNote.content } })}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                      aria-label="Study with AI"
                      title="Study with AI">
                      <Brain size={16} />
                    </Button>
                  )}

                  {/* --- Download Button --- */}
                  <Button
                    onClick={() => handleDownloadFile(activeNote)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    aria-label="Download note"
                    title="Download"
                  >
                    <Download size={16} />
                  </Button>

                  {/* --- Edit/Save Buttons --- */}
                  {activeNote.type === 'text' && (
                    isEditingNote ? (
                      <Button onClick={() => onSaveEdit(activeNote)} className="px-3 py-1.5 text-xs">
                        <Save size={14} className="mr-1" /> Save
                      </Button>
                    ) : (
                      <Button onClick={onEditClick} className="p-2 text-slate-400 hover:text-white transition-colors" aria-label="Edit note" title="Edit">
                        <Edit size={16} />
                      </Button>
                    )
                  )}

                  {/* --- Delete Button --- */}
                  <Button onClick={() => onDeleteNote(activeNote)} className="p-2 text-red-500 hover:text-red-400 transition-colors" aria-label="Delete note" title="Delete">
                    <Trash2 size={16} />
                  </Button>

                </div>
              </div>

              {/* --- Content Display --- */}
              {isEditingNote && activeNote.type === 'text' ? (
                <Textarea
                  id="note-edit-textarea"
                  name="noteContent"
                  aria-label="Edit note content"
                  value={editedContent}
                  onChange={(e) => onContentChange(e.target.value)}
                  className="flex-1 w-full h-full p-4 bg-slate-800 border-none focus:ring-0 text-base"
                  placeholder="Start writing your note..."
                />
              ) : (
                <div className="p-4">
                  {activeNote.type === 'text' && (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{activeNote.content || ''}</ReactMarkdown>
                      {!activeNote.content && <p className="text-slate-400">This note is empty. Click 'Edit' to start writing.</p>}
                    </div>
                  )}
                  {(activeNote.type === 'file' || activeNote.fileUrl) && activeNote.type !== 'text' && (
                    <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                      <p className="text-slate-300">File Note: <span className="font-semibold text-white">{activeNote.fileName || activeNote.title}</span></p>
                      <p className="text-sm text-slate-400 mt-2">This is a file resource. You can download it or generate flashcards from its content using the buttons above.</p>
                      {activeNote.content === "[Text extraction pending or failed]" && (
                        <p className="text-amber-400 text-sm mt-2">Could not automatically extract text from this file.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mb-6 shadow-2xl relative shadow-violet-900/5">
                <FileText className="w-6 h-6 text-slate-800" />
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">No Document Selected</h3>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic mb-10 max-w-xs leading-relaxed">
                Choose an entry from the repository list to start reviewing content.
              </p>
              
              <motion.div 
                animate={{ x: [-8, 0, -8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-3 text-violet-500/80 bg-violet-600/5 px-6 py-2 rounded-full border border-violet-500/10"
              >
                <ArrowLeft size={14} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Select From Feed</span>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  };
// --- END REPLACEMENT ---


// --- AddNoteModal Sub-Component (MODIFIED) ---
const AddNoteModal: React.FC<{ isOpen: boolean, onClose: () => void, courseId: string, onNoteAdded: (id?: string) => void }> = ({
  isOpen, onClose, courseId, onNoteAdded
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteType, setNoteType] = useState<'text' | 'file'>('file');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Robust Validation
    if (!courseId) {
      showToast("Please select a course first.", 'error');
      return;
    }
    
    if (noteType === 'file' && !file) {
      showToast("Please select a valid file to upload (PDF, PPTX, TXT, etc.)", 'info');
      return;
    }
    
    if (noteType === 'text') {
      if (!content || content.trim().length < 10) {
        showToast("Please enter at least 10 characters for your note.", 'info');
        return;
      }
      if (!title || title.trim().length < 3) {
        showToast("Please provide a descriptive title (at least 3 characters).", 'info');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (noteType === 'file' && file) {
        const addedNote = await uploadNoteFile(courseId, title || file.name, file);
        showToast(`"${file.name}" synchronized with your library.`, 'success');
        onNoteAdded(addedNote?.id);
      } else if (noteType === 'text') {
        const noteTitle = title || "Untitled Note";
        const addedNote = await addTextNote(courseId, noteTitle, content);
        showToast(`Text note "${noteTitle}" saved successfully.`, 'success');
        onNoteAdded(addedNote?.id);
      }
      onClose(); // Reset is handled by useEffect on close
    } catch (error) {
      console.error("Failed to add note:", error);
      showToast("Sync failed. Please check your connection and try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset internal state when the modal is closed externally
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setFile(null);
      setNoteType('file');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Resource">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center bg-slate-700/50 rounded-lg p-1">
          <Button type="button" onClick={() => setNoteType('text')} className={`w-1/2 rounded-md ${noteType === 'text' ? 'bg-violet-600 shadow-md' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-600/50'}`}>
            <FileText size={16} className="mr-2" /> Text Note
          </Button>
          <Button type="button" onClick={() => setNoteType('file')} className={`w-1/2 rounded-md ${noteType === 'file' ? 'bg-violet-600 shadow-md' : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-600/50'}`}>
            <Upload size={16} className="mr-2" /> Upload File
          </Button>
        </div>

        <div>
          <label htmlFor="add-note-title" className="sr-only">Title</label>
          <Input
            id="add-note-title"
            name="noteTitle"
            aria-label="Note title"
            autoComplete="off"
            placeholder="Title (Optional - uses filename if blank)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {noteType === 'text' && (
          <>
            <label htmlFor="add-note-content" className="sr-only">Note Content</label>
            <Textarea
              id="add-note-content"
              name="noteContent"
              aria-label="Note entry content"
              autoComplete="off"
              placeholder="Write your note or doubt here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              className="bg-slate-900/50 border-white/5 resize-none focus:ring-violet-500/50"
            />
          </>
        )}

        {noteType === 'file' && (
          <div className="flex items-center justify-center w-full">
            <label htmlFor="modal-file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700/50 hover:border-violet-500 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload size={24} className="text-slate-400 mb-2 group-hover:text-violet-400 transition-colors" />
                <p className="mb-2 text-sm text-slate-400 text-center px-2">
                  {file ? <span className="text-violet-400 font-semibold">{file.name}</span> : <><span className="font-semibold text-slate-300">Click to upload</span> or drag and drop</>}
                </p>
                <p className="text-xs text-slate-500">PDF, TXT, MD, PPTX, Audio</p>
              </div>
              <input
                id="modal-file-upload"
                name="noteFile"
                type="file"
                className="hidden"
                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                accept=".txt,.md,.pdf,.pptx,.ppt,.png,.jpg,.jpeg,.mp3,.wav,.ogg,.aac"
              />
            </label>
          </div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500" disabled={isSubmitting || (noteType === 'file' && !file) || (noteType === 'text' && !content)}>
          {isSubmitting ? 'Adding...' : (noteType === 'file' ? 'Upload File' : 'Save Note')}
        </Button>
      </form>
    </Modal>
  );
};

// --- FlashcardsView Sub-Component ---
const FlashcardsView: React.FC<{
  flashcards: FlashcardType[],
  onGenerateFromNotes: () => void,
  onGenerateFromFile: (file: File | null) => void,
  isGenerating: boolean,
  isFileGenerating: boolean,
  courseId: string,
  notes: Note[],
  onUpdateCard: (card: FlashcardType, correct: boolean) => void
}> = ({
  flashcards, onGenerateFromNotes, onGenerateFromFile, isGenerating, isFileGenerating, courseId, notes, onUpdateCard
}) => {
    const { showToast } = useToast();
    const [reviewFlashcards, setReviewFlashcards] = useState<FlashcardType[]>([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onGenerateFromFile(file);
      }
      // Reset file input to allow uploading the same file again
      if (event.target) {
        event.target.value = '';
      }
    };

    const startReview = () => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const reviewable = flashcards.filter(f => {
        if (!f.lastReview || !f.bucket) return true;
        const daysSinceReview = (now - f.lastReview) / oneDay;
        if (f.bucket === 1) return daysSinceReview >= 1;
        if (f.bucket === 2) return daysSinceReview >= 3;
        if (f.bucket === 3) return daysSinceReview >= 7;
        if (f.bucket === 4) return daysSinceReview >= 14;
        return daysSinceReview >= 30;
      });
      setReviewFlashcards(reviewable);
      setIsReviewing(true);
    };


    return (
      <div className="p-10 overflow-y-auto h-full flex flex-col items-center justify-center">
        {/* Hidden file input */}
        <input
          type="file"
          id="flashcard-file-upload"
          name="flashcardFile"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".txt,.md,.pdf,.pptx,.ppt,.png,.jpg,.jpeg"
          aria-label="Upload file for flashcard generation"
        />

        {flashcards.length === 0 ? (
          <div className="max-w-md text-center">
             <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl relative shadow-violet-900/10">
                <Layers className="w-8 h-8 text-slate-800" />
            </div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">Intelligence Offline</h3>
            <p className="text-slate-500 mb-10 text-[11px] font-black leading-relaxed uppercase tracking-[0.3em] italic opacity-60">
              Generate flashcards from your existing notes to start revising faster with AI.
            </p>

            <div className="flex flex-col gap-3 items-center">
              <Button 
                onClick={onGenerateFromNotes} 
                disabled={isGenerating || isFileGenerating || notes.length === 0} 
                isLoading={isGenerating}
                className="w-full h-14 bg-violet-600 hover:bg-violet-500 text-[10px] font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-violet-900/20"
              >
                <Sparkles size={14} className="mr-2" /> Initialize AI Generation
              </Button>
              
              <div className="flex gap-2 w-full mt-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating || isFileGenerating}
                    className="flex-1 h-12 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 transition-all opacity-60 hover:opacity-100"
                >
                  <Upload size={14} /> From File
                </button>
                <button
                    disabled
                    className="flex-1 h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-700 opacity-20 cursor-not-allowed"
                >
                  Manual Entry
                </button>
              </div>
            </div>
            
            {notes.length === 0 && (
              <p className="mt-8 text-[8px] font-black text-rose-500/60 uppercase tracking-[0.2em] italic">
                Requires Notes Feed Data to Activate
              </p>
            )}
          </div>
        ) : (
          <div className="w-full h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Memory Matrix</h3>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mt-1">Found {flashcards.length} revision nodes in context</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => fileInputRef.current?.click()} disabled={isGenerating || isFileGenerating} variant="ghost" className="text-[9px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/5">
                    + Upload File
                  </Button>
                  <Button onClick={startReview} className="bg-violet-600 shadow-xl shadow-violet-900/20 text-[9px] font-black uppercase tracking-widest italic px-8">
                    Start Review Session
                  </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {flashcards.map((card) => (
                <Flashcard 
                  key={card.id} 
                  front={card.front} 
                  back={card.back} 
                  isFlagged={card.bucket === 1 && card.lastReview === 0}
                  onFlag={async () => {
                    // Manual review injection: Reset progress to Bucket 1, LastReview 0
                    // This forces the card into the next review session
                    try {
                      await updateFlashcard(courseId, card.id, { bucket: 1, lastReview: 0 });
                      // We need to reload to show the UI change
                      onUpdateCard(card, false); // Reuse existing reload/state logic
                      showToast("Card added to immediate review pool.", 'success');
                    } catch (e) {
                      showToast("Failed to flag card.", 'error');
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {isReviewing && (
          <FlashcardPlayer
            flashcards={reviewFlashcards}
            onComplete={() => setIsReviewing(false)}
            onUpdateCard={onUpdateCard}
          />
        )}
      </div>
    );
  };

// --- FlashcardPlayer Sub-Component ---
const FlashcardPlayer: React.FC<{ flashcards: FlashcardType[], onComplete: () => void, onUpdateCard: (card: FlashcardType, correct: boolean) => void }> = ({ flashcards, onComplete, onUpdateCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = (correct: boolean) => {
    onUpdateCard(flashcards[currentIndex], correct);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      onComplete(); // Close after the last card
    }
  };


  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in-50" onClick={onComplete}>
        <div className="bg-slate-800 p-8 rounded-lg text-center" onClick={e => e.stopPropagation()}>
          <p className="text-xl text-white">No flashcards are due for review today!</p>
          <p className="text-slate-400 mb-6">Check back later or review all cards from the main page.</p>
          <Button onClick={onComplete} className="mt-4">Close</Button>
        </div>
      </div>
    )
  }

  const card = flashcards[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in-50">
      <button onClick={onComplete} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
        <X size={24} />
      </button>
      <div
        className="relative w-full max-w-2xl h-80 cursor-pointer group"
        style={{ perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d shadow-2xl rounded-xl ${isFlipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute w-full h-full bg-slate-700 rounded-lg flex items-center justify-center p-8 text-center backface-hidden">
            <p className="text-2xl text-white">{card.front}</p>
          </div>
          {/* Back */}
          <div className="absolute w-full h-full bg-sky-600 rounded-lg flex items-center justify-center p-8 text-center rotate-y-180 backface-hidden">
            <p className="text-2xl text-white">{card.back}</p>
          </div>
        </div>
      </div>

      <p className="text-slate-500 mt-4 text-xs animate-pulse uppercase tracking-widest">Tap the card to flip</p>
      <p className="text-slate-300 mt-1 text-sm">Card {currentIndex + 1} of {flashcards.length}</p>

      <div className="absolute bottom-10 flex gap-4">
        {!isFlipped ? (
          <Button onClick={() => setIsFlipped(true)} className="px-10 py-3 text-lg">Flip</Button>
        ) : (
          <>
            <Button onClick={() => handleNext(false)} className="bg-red-600 hover:bg-red-700 px-8 py-3 text-lg">Incorrect</Button>
            <Button onClick={() => setIsFlipped(false)} variant="outline" className="px-6 py-3 text-lg">Flip Back</Button>
            <Button onClick={() => handleNext(true)} className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg">Correct</Button>
          </>
        )}
      </div>
    </div>
  )
}

const QuizView: React.FC<{
  quizzes: PersonalQuiz[];
  onGenerateQuiz: () => void;
  isGenerating: boolean;
  notes: Note[];
  onUpdateScore: (id: string, score: number) => void;
}> = ({ quizzes, onGenerateQuiz, isGenerating, notes, onUpdateScore }) => {
  const [activeQuiz, setActiveQuiz] = useState<PersonalQuiz | null>(null);

  return (
    <div className="p-10 overflow-y-auto h-full flex flex-col items-center justify-center">
      {quizzes.length === 0 ? (
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl relative shadow-violet-900/10">
              <Brain className="w-8 h-8 text-slate-800" />
          </div>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">Zero Simulation Data</h3>
          <p className="text-slate-500 mb-10 text-[11px] font-black leading-relaxed uppercase tracking-[0.3em] italic opacity-60">
            Generate a personalized simulation based on your document feed to validate your understanding.
          </p>

          <Button 
              onClick={onGenerateQuiz} 
              disabled={isGenerating || notes.length === 0} 
              isLoading={isGenerating}
              className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-emerald-900/40"
          >
            <Zap size={14} className="mr-2" /> Start Knowledge Probe
          </Button>
          
          <div className="flex gap-2 justify-center mt-6 opacity-30">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                <div className="w-1 h-1 rounded-full bg-emerald-500" /> MCQ Mode
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                <div className="w-1 h-1 rounded-full bg-slate-600" /> Adaptive Difficulty
            </div>
          </div>
          
          {notes.length === 0 && (
            <p className="mt-8 text-[8px] font-black text-rose-500/60 uppercase tracking-[0.2em] italic">
              Repository Feed Empty - Intelligence Locked
            </p>
          )}
        </div>
      ) : (
        <div className="w-full h-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
              <div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Knowledge Simulations</h3>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mt-1">Previous evaluation history tracked for this context</p>
              </div>
              <Button onClick={onGenerateQuiz} disabled={isGenerating} className="h-10 px-6 bg-emerald-600 text-[10px] font-black uppercase tracking-widest italic rounded-xl shadow-lg shadow-emerald-900/10">
                 + New Probe
              </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {quizzes.map((quiz, idx) => (
              <div key={quiz.id || idx} className="bg-slate-900/60 p-5 rounded-2xl flex justify-between items-center border border-white/[0.04] group hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-5">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors border border-white/5">
                        <Zap size={16} />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black text-white uppercase italic tracking-tight">K-SIM PROBE #{quizzes.length - idx}</h4>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1 italic">{new Date(quiz.dateTaken || Date.now()).toLocaleDateString()} • {quiz.questions.length} Nodes Analyzed</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {quiz.completed && (
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Result Accuracy</p>
                            <p className={`text-lg font-black tracking-tighter ${quiz.score! >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{quiz.score}%</p>
                        </div>
                    )}
                    <Button onClick={() => setActiveQuiz(quiz)} variant="ghost" className="h-10 px-6 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-white/5">
                        {quiz.completed ? 'Review' : 'Initiate'}
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeQuiz && (
        <PersonalQuizPlayer
          quiz={activeQuiz}
          onClose={() => setActiveQuiz(null)}
          onComplete={(score) => {
            onUpdateScore(activeQuiz.id!, score);
            setActiveQuiz(null);
          }}
        />
      )}
    </div>
  );
};

const PersonalQuizPlayer: React.FC<{ quiz: PersonalQuiz, onClose: () => void, onComplete: (score: number) => void }> = ({ quiz, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1));
  const [showResults, setShowResults] = useState(quiz.completed || false);

  const handleAnswer = (optionIdx: number) => {
    if (showResults) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let correct = 0;
    answers.forEach((ans, idx) => {
      if (ans === quiz.questions[idx].correctOptionIndex) correct++;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    onComplete(score);
    setShowResults(true); // Technically component unmounts on complete, but just in case
  };

  const currentQ = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-in fade-in-50">
      <div className="bg-slate-800 rounded-2xl w-full max-w-3xl p-8 shadow-2xl ring-1 ring-slate-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>

        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Question {currentIndex + 1} of {quiz.questions.length}</h3>
          <div className="bg-slate-900 rounded-full px-3 py-1 text-sm text-slate-400">{currentQ.topic}</div>
        </div>

        <p className="text-lg text-slate-200 mb-8">{currentQ.question}</p>

        <div className="grid gap-3 mb-8">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentIndex] === idx;
            const isCorrect = currentQ.correctOptionIndex === idx;

            let className = "p-4 rounded-xl text-left border-2 transition-all ";
            if (showResults) {
              if (isCorrect) className += "bg-emerald-900/30 border-emerald-500 text-emerald-100";
              else if (isSelected && !isCorrect) className += "bg-red-900/30 border-red-500 text-red-100";
              else className += "bg-slate-700 border-transparent opacity-50";
            } else {
              if (isSelected) className += "bg-violet-600/20 border-violet-500 text-violet-100";
              else className += "bg-slate-700 border-transparent hover:bg-slate-600 text-slate-200";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showResults}
                className={className}
              >
                {opt}
              </button>
            )
          })}
        </div>

        <div className="flex justify-between">
          <Button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} variant="secondary">Previous</Button>
          {isLast ? (
            !showResults && <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-500" disabled={answers.includes(-1)}>Submit Quiz</Button>
          ) : (
            <Button onClick={() => setCurrentIndex(prev => prev + 1)}>Next</Button>
          )}
        </div>
      </div>
    </div>
  );
};


// --- StudyPlanView Sub-Component ---
const StudyPlanView: React.FC<{
  courseId: string;
  courseName: string;
  notes: Note[];
  studyPlan: any;
  onPlanSaved: (plan: any) => void;
}> = ({ courseId, courseName, notes, studyPlan, onPlanSaved }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    if (notes.length === 0) return;
    setIsGenerating(true);
    try {
      // Simulation of generating a mastery path
      setTimeout(() => {
        const mockPlan = { 
            id: Date.now(), 
            title: "Mastery Path", 
            active: true,
            nodes: notes.map((n, i) => ({ id: i, label: n.title }))
        };
        onPlanSaved(mockPlan);
        setIsGenerating(false);
      }, 2000);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  if (!studyPlan) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl relative shadow-violet-900/10">
            <Zap className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">Project Evolution</h3>
          <p className="text-slate-500 mb-10 text-[11px] font-black leading-relaxed uppercase tracking-[0.3em] italic opacity-60">
            Analyze your overall progress across this course to generate a specialized knowledge mastery path.
          </p>

          <Button 
            onClick={handleGeneratePlan} 
            disabled={notes.length === 0 || isGenerating} 
            isLoading={isGenerating}
            className="h-14 px-10 bg-violet-600 hover:bg-violet-500 text-[10px] font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-violet-900/20"
          >
            <Sparkles size={14} className="mr-2" /> Architect Mastery Path
          </Button>
          
          {notes.length === 0 && (
            <p className="mt-8 text-[8px] font-black text-rose-500/60 uppercase tracking-[0.2em] italic">
              Repository Feed Empty - Intelligence Locked
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-8">
          <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Evolution Strategy</h3>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mt-1">Found {studyPlan.nodes?.length || 0} optimization nodes in your current feed</p>
          </div>
          <Button onClick={() => onPlanSaved(null)} variant="ghost" className="h-10 px-6 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-white/5">
              Reset Path
          </Button>
      </div>

      <div className="bg-slate-900/60 p-8 rounded-2xl border border-white/[0.04] relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
         <div className="flex items-center gap-4 text-amber-400 mb-6 relative z-10">
            <Sparkles size={20} className="animate-pulse" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white italic">Neural Roadmap Active</p>
         </div>
         <p className="text-slate-400 text-xs leading-relaxed italic mb-8 relative z-10">
            Your evolutionary mastery path for <span className="text-white font-bold">{courseName}</span> has been successfully architected. Our engines have mapped your {notes.length} repository entries into a sequential study roadmap.
         </p>
         
         <div className="space-y-3 relative z-10">
            {studyPlan.nodes?.slice(0, 3).map((node: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-950/40 rounded-xl border border-white/5 group-hover:border-amber-500/20 transition-all">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-500 italic">
                        {i+1}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight truncate italic">{node.label}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Notes;
