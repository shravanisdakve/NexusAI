import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Spinner, Modal } from '../components/ui';
import { 
  ArrowLeft, 
  Highlighter, 
  FileText, 
  Brain, 
  Layers, 
  Share2, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { generateHighlights, generateMindMap, simplifyText, generateQuizSet, generateFlashcards, summarizeText } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import PomodoroTimer from '../components/PomodoroTimer';
import Flashcard from '../components/Flashcard';

const ELI5Modal: React.FC<{ isOpen: boolean; onClose: () => void; content: string; isLoading: boolean }> = ({ isOpen, onClose, content, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💡 Explain Like I'm 5">
      <div className="space-y-4 p-2">
        {isLoading ? (
          <div className="flex flex-col items-center py-12 space-y-4">
            <Spinner size="lg" />
            <p className="text-slate-400 animate-pulse">Consulting the AI Guru...</p>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            <div className="bg-violet-500/10 border border-violet-500/20 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={48} className="text-violet-400" />
              </div>
              <div className="text-slate-200 leading-relaxed">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={onClose} variant="primary">Got it, thanks! ✨</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const SmartStudy: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const initialNote = location.state?.note || null;
  const [note, setNote] = useState(initialNote);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [mindMapCode, setMindMapCode] = useState<string>('');
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState('');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isELI5Open, setIsELI5Open] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'quiz' | 'flashcards' | 'mindmap'>('controls');
  const [synthesizedNotes, setSynthesizedNotes] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerPosition, setTimerPosition] = useState({ x: 20, y: 20 });
  
  const mindMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialNote) {
      navigate('/notes');
    }
  }, [initialNote, navigate]);

  useEffect(() => {
    if (activeTab === 'mindmap' && mindMapCode && mindMapRef.current) {
      renderMindMap();
    }
  }, [activeTab, mindMapCode]);

  const renderMindMap = async () => {
    if (!mindMapRef.current) return;
    try {
      mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
      const { svg } = await mermaid.render('mindmap-svg', mindMapCode);
      mindMapRef.current.innerHTML = svg;
    } catch (err) {
      console.error("Mermaid render error:", err);
    }
  };

  const handleHighlight = async () => {
    if (!note?.content || isHighlighting) return;
    setIsHighlighting(true);
    try {
      const result = await generateHighlights(note.content, language);
      setHighlights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHighlighting(false);
    }
  };

  const handleMindMap = async () => {
    if (!note?.content || isGeneratingMindMap) return;
    setIsGeneratingMindMap(true);
    setActiveTab('mindmap');
    try {
      const code = await generateMindMap(note.content, language);
      setMindMapCode(code);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  const handleELI5 = async () => {
    if (!note?.content || isSimplifying) return;
    setIsELI5Open(true);
    setIsSimplifying(true);
    try {
      const result = await simplifyText(note.content, language);
      setSimplifiedText(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleSynthesizeNotes = async () => {
    if (!note?.content || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const result = await summarizeText(note.content, language);
      setSynthesizedNotes(result);
      // Auto-switch highlights so user sees what was fetched? 
      // Or just show in a toast. For now, we'll keep it in state.
      alert("Notes Synthesized! Important points have been 'fetched out'.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!note?.content || isGeneratingQuiz) return;
    setIsGeneratingQuiz(true);
    try {
      const result = await generateQuizSet(note.content, 5, language);
      const questionSet = JSON.parse(result);
      setQuizzes(questionSet);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!note?.content || isGeneratingFlashcards) return;
    setIsGeneratingFlashcards(true);
    try {
      const result = await generateFlashcards(note.content, language);
      const cardSet = JSON.parse(result);
      setFlashcards(cardSet);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const renderContentWithHighlights = () => {
    if (!note?.content) return null;
    if (highlights.length === 0) return note.content;

    let text = note.content;
    highlights.forEach((h, i) => {
      // Escape special characters for regex
      const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      text = text.replace(regex, `<mark class="bg-violet-500/40 text-white rounded px-1 animate-pulse" style="animation-delay: ${i * 0.1}s">$1</mark>`);
    });

    return <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} className="leading-relaxed" />;
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/notes')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-violet-400" size={24} />
              AI Study Guru <span className="text-slate-500 text-sm font-normal">| {note?.title}</span>
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="ghost" size="sm" onClick={handleELI5} className="text-amber-400 hover:bg-amber-400/10">
              <Brain size={16} className="mr-2" /> Explain Like I'm 5
           </Button>
           <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowTimer(!showTimer)} 
              className={`${showTimer ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400'}`}
           >
              <RefreshCw size={16} className={`mr-2 ${showTimer ? 'animate-spin' : ''}`} /> {showTimer ? 'Hide Timer' : 'Study Timer'}
           </Button>
           <Button variant="ghost" size="sm" className="text-slate-400">
              <Share2 size={16} className="mr-2" /> Share
           </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Pane: Document Viewer */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/30 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <FileText size={18} className="text-sky-400" />
              Document Content
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono">
                {note?.content?.length || 0} characters
              </span>
              <button 
                onClick={() => setHighlights([])} 
                className={`p-1.5 rounded-md hover:bg-slate-700 transition-colors ${highlights.length > 0 ? 'text-red-400' : 'text-slate-600 cursor-not-allowed'}`}
                title="Clear Highlights"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 text-slate-300 text-lg selection:bg-violet-500/30">
            {renderContentWithHighlights()}
          </div>
        </div>

        {/* Right Pane: AI Toolbar */}
        <div className="w-[400px] flex flex-col gap-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl ring-1 ring-white/5">
            {/* Context Tabs */}
            <div className="flex border-b border-slate-700">
              <button 
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'controls' ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-400/5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Controls
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'quiz' ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-400/5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Quiz
              </button>
              <button 
                onClick={() => setActiveTab('mindmap')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'mindmap' ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-400/5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Mind Map
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'controls' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
                  {/* Tool 1: Highlighter */}
                  <div className="group bg-slate-900 border border-slate-700/50 p-6 rounded-2xl hover:border-violet-500/40 transition-all duration-300 hover:shadow-glow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                        <Highlighter size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">AI Key Point Highlighter</h3>
                        <p className="text-xs text-slate-500">Identify critical concepts automatically</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleHighlight} 
                      isLoading={isHighlighting}
                      className="w-full bg-violet-600/80 hover:bg-violet-600 border-none py-2.5 rounded-xl shadow-lg shadow-violet-900/20"
                    >
                      Highlight Key Points
                    </Button>
                  </div>

                  {/* Tool 2: Mind Map */}
                  <div className="group bg-slate-900 border border-slate-700/50 p-6 rounded-2xl hover:border-sky-500/40 transition-all duration-300 hover:shadow-glow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400">
                        <Brain size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">Visual Mind Map</h3>
                        <p className="text-xs text-slate-500">See the structural relationships</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleMindMap}
                      isLoading={isGeneratingMindMap}
                      className="w-full bg-sky-600/80 hover:bg-sky-600 border-none py-2.5 rounded-xl"
                    >
                      Generate Map
                    </Button>
                  </div>

                  {/* Tool 3: Smart Notes */}
                  <div className="group bg-slate-900 border border-slate-700/50 p-6 rounded-2xl hover:border-pink-500/40 transition-all duration-300 hover:shadow-glow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">AI Smart Notes</h3>
                        <p className="text-xs text-slate-500">Convert document into revision notes</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSynthesizeNotes}
                      isLoading={isSynthesizing}
                      className="w-full bg-pink-600/80 hover:bg-pink-600 border-none py-2.5 rounded-xl shadow-lg shadow-pink-900/20"
                    >
                      {synthesizedNotes ? 'Update Notes' : 'Synthesize Notes'}
                    </Button>
                    {synthesizedNotes && (
                      <div className="mt-4 p-4 bg-slate-900/80 rounded-xl border border-pink-500/20 text-sm text-slate-300 animate-in fade-in zoom-in duration-300">
                         <div className="flex items-center gap-2 mb-2 text-pink-400 font-bold">
                            <Layers size={14} /> Synthesized Concept
                         </div>
                          <div className="prose prose-sm prose-invert max-h-[400px] overflow-y-auto pr-2">
                             <ReactMarkdown>{synthesizedNotes}</ReactMarkdown>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'mindmap' && (
                <div className="h-full flex flex-col space-y-4 animate-in zoom-in duration-300">
                   {isGeneratingMindMap ? (
                     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Spinner size="lg" />
                        <p className="text-slate-400">Drawing conceptual connections...</p>
                     </div>
                   ) : mindMapCode ? (
                     <div className="flex-1 flex flex-col">
                        <div ref={mindMapRef} className="flex-1 bg-slate-900 rounded-2xl p-4 overflow-auto min-h-[400px] flex items-center justify-center" />
                        <Button onClick={handleMindMap} variant="ghost" className="mt-4 text-xs">
                           <RefreshCw size={14} className="mr-2" /> Regenerate Map
                        </Button>
                     </div>
                   ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 border-2 border-dashed border-slate-700 rounded-3xl">
                        <Brain size={48} className="text-slate-700" />
                        <p className="text-slate-500 text-sm">Mind Map not generated yet. Use the control panel to start.</p>
                        <Button onClick={handleMindMap} size="sm">Generate Now</Button>
                     </div>
                   )}
                </div>
              )}

              {activeTab === 'quiz' && (
                <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right duration-300">
                   {isGeneratingQuiz ? (
                     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Spinner size="lg" />
                        <p className="text-slate-400">Crafting personalized assessment...</p>
                     </div>
                   ) : quizzes.length > 0 ? (
                     <div className="space-y-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                           <p className="text-emerald-400 font-bold">Quiz Ready! ✨</p>
                           <p className="text-xs text-slate-400">5 questions generated based on this document.</p>
                        </div>
                        {quizzes.slice(0, 1).map((q, i) => (
                          <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                             <p className="text-sm text-white font-medium mb-3">{q.question}</p>
                             <div className="grid gap-2">
                                {q.options.map((opt: string, oi: number) => (
                                  <button key={oi} className="text-left text-xs p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-white/5">
                                     {opt}
                                  </button>
                                ))}
                             </div>
                          </div>
                        ))}
                        <Button variant="ghost" className="w-full text-xs" onClick={() => navigate('/quizzes')}>
                           Go to Full Quiz Practice
                        </Button>
                     </div>
                   ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 border-2 border-dashed border-slate-700 rounded-3xl">
                        <Brain size={48} className="text-slate-700" />
                        <p className="text-slate-500 text-sm">Test your knowledge with a document-based quiz.</p>
                        <Button onClick={handleGenerateQuiz}>Generate Quiz</Button>
                     </div>
                   )}
                </div>
              )}

              {activeTab === 'flashcards' && (
                <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right duration-300">
                   {isGeneratingFlashcards ? (
                     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Spinner size="lg" />
                        <p className="text-slate-400">Distilling key terms...</p>
                     </div>
                   ) : flashcards.length > 0 ? (
                     <div className="space-y-4">
                        <div className="grid gap-4 overflow-y-auto max-h-[400px]">
                           {flashcards.map((card, i) => (
                             <Flashcard key={i} front={card.front} back={card.back} />
                           ))}
                        </div>
                        <Button onClick={handleGenerateFlashcards} variant="ghost" className="w-full text-xs">
                           Regenerate Cards
                        </Button>
                     </div>
                   ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 border-2 border-dashed border-slate-700 rounded-3xl">
                        <Layers size={48} className="text-slate-700" />
                        <p className="text-slate-500 text-sm">Create flashcards from the core terms in this document.</p>
                        <Button onClick={handleGenerateFlashcards}>Generate Flashcards</Button>
                     </div>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ELI5Modal 
        isOpen={isELI5Open} 
        onClose={() => setIsELI5Open(false)} 
        content={simplifiedText} 
        isLoading={isSimplifying} 
      />

      {showTimer && (
        <div 
          className="fixed bottom-10 right-10 z-[100] shadow-2xl scale-75 origin-bottom-right"
        >
          <div className="relative">
            <button 
              onClick={() => setShowTimer(false)}
              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full z-10 hover:bg-red-400 shadow-lg"
            >
              <ArrowLeft size={16} className="rotate-45" />
            </button>
            <PomodoroTimer />
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartStudy;
