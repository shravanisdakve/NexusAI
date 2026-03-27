import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layers, Network, Brain, Wand2, Target, RotateCcw, MessageSquare } from 'lucide-react';
import { Button, Spinner } from './ui';
import FlashcardDeck from './FlashcardDeck';
import KnowledgeMap from './KnowledgeMap';
import FeynmanAssistant from './FeynmanAssistant';
import { generateFlashcards as generateFlashcardsApi } from '../services/geminiService';
import { getFlashcards, addFlashcards, getQuizzes } from '../services/notesService';
import { Flashcard as FlashcardType } from '../types';

type ToolTab = 'flashcards' | 'map' | 'feynman' | 'gaps';

interface StudyToolsPanelProps {
    notes: string;
    topic: string;
    isActive: boolean;
    courseId?: string;
    knowledgeGaps?: string[];
    onTriggerGapAnalysis?: () => Promise<void>;
    trackedConcepts?: string[];
    onTrackConcept?: (concept: string) => Promise<void>;
    activeTechnique?: string;
}

const StudyToolsPanel: React.FC<StudyToolsPanelProps> = ({ 
    notes, topic, isActive, courseId, knowledgeGaps, onTriggerGapAnalysis,
    trackedConcepts = [], onTrackConcept, activeTechnique
}) => {
    const [activeTab, setActiveTab] = useState<ToolTab | 'review'>('flashcards');
    const [newConceptInput, setNewConceptInput] = useState('');
    const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
    const [isGeneratingCards, setIsGeneratingCards] = useState(false);
    const [isFetchingCards, setIsFetchingCards] = useState(false);
    const [isAnalyzingGaps, setIsAnalyzingGaps] = useState(false);
    const [quizScores, setQuizScores] = useState<number[]>([]);
    const canPersistFlashcards = !!courseId && courseId !== 'general';
    const generalFlashcardsStorageKey = useMemo(() => {
        if (canPersistFlashcards) return null;
        const safeTopic = (topic || 'general')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64) || 'general';
        return `nexusai:flashcards:general:${safeTopic}`;
    }, [canPersistFlashcards, topic]);

    const normalizeFlashcards = (value: unknown): { front: string; back: string }[] => {
        if (Array.isArray(value)) return value as { front: string; back: string }[];
        if (!value || typeof value !== 'object') return [];

        const obj = value as Record<string, unknown>;
        if (Array.isArray(obj.flashcards)) return obj.flashcards as { front: string; back: string }[];
        if (Array.isArray(obj.cards)) return obj.cards as { front: string; back: string }[];
        if (Array.isArray(obj.data)) return obj.data as { front: string; back: string }[];
        return [];
    };

    const normalizeDeckCards = (value: unknown): FlashcardType[] => {
        if (!Array.isArray(value)) return [];
        return value
            .filter((card: any) => card && typeof card.id === 'string' && typeof card.front === 'string' && typeof card.back === 'string')
            .map((card: any) => ({
                id: card.id,
                front: card.front,
                back: card.back,
                bucket: Math.min(5, Math.max(1, Number(card.bucket) || 1)),
                lastReview: typeof card.lastReview === 'number'
                    ? card.lastReview
                    : new Date(card.lastReview || Date.now()).getTime()
            }));
    };

    const getNextDueTimestamp = (card: FlashcardType): number => {
        const intervalByBucketMs = [
            0,
            5 * 60 * 1000,
            20 * 60 * 1000,
            2 * 60 * 60 * 1000,
            12 * 60 * 60 * 1000,
            24 * 60 * 60 * 1000
        ];
        const bucket = Math.min(5, Math.max(1, Number(card.bucket) || 1));
        const lastReview = typeof card.lastReview === 'number'
            ? card.lastReview
            : new Date(card.lastReview || Date.now()).getTime();
        return lastReview + intervalByBucketMs[bucket];
    };

    const sortCardsForReview = (cards: FlashcardType[]): FlashcardType[] => {
        return [...cards].sort((a, b) => getNextDueTimestamp(a) - getNextDueTimestamp(b));
    };

    const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

    const mapData = useMemo(() => {
        const topicLabel = (topic || 'Current Topic').trim() || 'Current Topic';
        const totalCards = flashcards.length;
        const now = Date.now();

        let mastery = 0.15;
        let retention = 0.15;
        let coverage = 0.05;
        let gapClosure = 0.2;
        let avgBucket = 1;
        let dueCount = 0;
        let hardCards = 0;

        if (totalCards > 0) {
            avgBucket = flashcards.reduce((sum, card) => {
                const bucket = Math.min(5, Math.max(1, Number(card.bucket) || 1));
                return sum + bucket;
            }, 0) / totalCards;

            mastery = clamp01(avgBucket / 5);
            coverage = clamp01(totalCards / 20);

            dueCount = flashcards.filter((card) => {
                const bucket = Math.min(5, Math.max(1, Number(card.bucket) || 1));
                const lastReview = typeof card.lastReview === 'number'
                    ? card.lastReview
                    : new Date(card.lastReview || Date.now()).getTime();
                const intervalByBucketMs = [
                    0,
                    5 * 60 * 1000,
                    20 * 60 * 1000,
                    2 * 60 * 60 * 1000,
                    12 * 60 * 60 * 1000,
                    24 * 60 * 60 * 1000
                ];
                return now >= (lastReview + intervalByBucketMs[bucket]);
            }).length;

            retention = clamp01(1 - (dueCount / totalCards));

            hardCards = flashcards.filter((card) => (Number(card.bucket) || 1) <= 2).length;
            gapClosure = clamp01(1 - (hardCards / totalCards));
        }

        const validQuizScores = quizScores.filter((score) => Number.isFinite(score));
        const avgQuizScore = validQuizScores.length > 0
            ? validQuizScores.reduce((sum, score) => sum + score, 0) / validQuizScores.length
            : null;
        const quizAccuracy = avgQuizScore !== null
            ? clamp01(avgQuizScore / 100)
            : clamp01((mastery * 0.6) + (retention * 0.4));

        const topicStrength = clamp01(
            (mastery * 0.35)
            + (retention * 0.25)
            + (quizAccuracy * 0.25)
            + (coverage * 0.15)
        );

        return [
            {
                name: topicLabel,
                strength: topicStrength,
                details: [
                    `Overall = 35% mastery + 25% retention + 25% quiz + 15% coverage`,
                    `Flashcards: ${totalCards}`,
                    `Due cards now: ${dueCount}`,
                    avgQuizScore !== null ? `Avg quiz score: ${avgQuizScore.toFixed(1)}%` : 'Quiz data: not available yet',
                ]
            },
            {
                name: 'Flashcard Mastery',
                strength: mastery,
                details: [
                    `From average bucket level`,
                    `Avg bucket: ${avgBucket.toFixed(2)} / 5`,
                    `Higher bucket means stronger long-term memory`,
                ]
            },
            {
                name: 'Recall Retention',
                strength: retention,
                details: [
                    `Based on how many cards are due vs not due`,
                    `Due cards: ${dueCount}/${totalCards || 0}`,
                    `More due cards lowers retention score`,
                ]
            },
            {
                name: 'Quiz Accuracy',
                strength: quizAccuracy,
                details: [
                    avgQuizScore !== null
                        ? `Average from saved quiz scores: ${avgQuizScore.toFixed(1)}%`
                        : 'No quiz history yet, using fallback from flashcard signals',
                    `Quizzes counted: ${validQuizScores.length}`,
                ]
            },
            {
                name: 'Gap Closure',
                strength: gapClosure,
                details: [
                    `Measures weak-card reduction`,
                    `Hard cards (bucket <= 2): ${hardCards}/${totalCards || 0}`,
                    `Fewer weak cards = higher score`,
                ]
            },
        ];
    }, [topic, flashcards, quizScores]);

    const loadLocalFlashcards = useCallback((): FlashcardType[] => {
        if (!generalFlashcardsStorageKey) return [];
        try {
            const raw = localStorage.getItem(generalFlashcardsStorageKey);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return sortCardsForReview(normalizeDeckCards(parsed));
        } catch (error) {
            console.error('Failed to parse locally saved flashcards', error);
            return [];
        }
    }, [generalFlashcardsStorageKey]);

    const persistLocalFlashcards = useCallback((nextCards: FlashcardType[]) => {
        if (!generalFlashcardsStorageKey) return;
        try {
            localStorage.setItem(generalFlashcardsStorageKey, JSON.stringify(nextCards));
        } catch (error) {
            console.error('Failed to persist local flashcards', error);
        }
    }, [generalFlashcardsStorageKey]);

    // Fetch existing flashcards
    useEffect(() => {
        const fetchCards = async () => {
            if (!canPersistFlashcards) {
                setFlashcards(loadLocalFlashcards());
                return;
            }

            if (!courseId) {
                setFlashcards([]);
                return;
            }

            setIsFetchingCards(true);
            try {
                const existing = await getFlashcards(courseId);
                if (existing && existing.length > 0) {
                    setFlashcards(sortCardsForReview(normalizeDeckCards(existing)));
                } else {
                    setFlashcards([]);
                }
            } catch (error) {
                console.error("Failed to fetch existing flashcards", error);
            } finally {
                setIsFetchingCards(false);
            }
        };
        fetchCards();
    }, [courseId, canPersistFlashcards, loadLocalFlashcards]);

    // Fetch quiz performance for knowledge-map signals
    useEffect(() => {
        const loadQuizScores = async () => {
            if (!canPersistFlashcards || !courseId) {
                setQuizScores([]);
                return;
            }

            try {
                const quizzes = await getQuizzes(courseId);
                const scores = (quizzes || [])
                    .map((quiz: any) => Number(quiz?.score))
                    .filter((score: number) => Number.isFinite(score));
                setQuizScores(scores);
            } catch (error) {
                console.error('Failed to fetch quiz stats for knowledge map', error);
                setQuizScores([]);
            }
        }
        loadQuizScores();
    }, [courseId, canPersistFlashcards]);

    const handleGenerateFlashcards = async () => {
        if (!notes) return;
        setIsGeneratingCards(true);
        try {
            const result = await generateFlashcardsApi(notes);
            let parsed: unknown = result;
            if (typeof result === 'string') {
                parsed = JSON.parse(result);
            }
            const rawCards = normalizeFlashcards(parsed);

            const enrichedCards: FlashcardType[] = rawCards
                .filter((c: any) => c && typeof c.front === 'string' && typeof c.back === 'string')
                .map((c: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                front: c.front,
                back: c.back,
                bucket: 1,
                lastReview: Date.now()
                }));

            if (enrichedCards.length === 0) {
                throw new Error('No valid flashcards were returned by the AI.');
            }

            if (canPersistFlashcards && courseId) {
                // Save to DB only for course-backed rooms.
                await addFlashcards(courseId, enrichedCards);
            }

            // Append to existing
            setFlashcards(prev => {
                const next = [...prev, ...enrichedCards];
                if (!canPersistFlashcards) {
                    persistLocalFlashcards(next);
                }
                return next;
            });
        } catch (error) {
            console.error("Failed to generate flashcards", error);
        } finally {
            setIsGeneratingCards(false);
        }
    };

    const handleDeckCardsChange = (nextCards: FlashcardType[]) => {
        setFlashcards(nextCards);
        if (!canPersistFlashcards) {
            persistLocalFlashcards(nextCards);
        }
    };

    const handleTriggerGaps = async () => {
        if (!onTriggerGapAnalysis) return;
        setIsAnalyzingGaps(true);
        try {
            await onTriggerGapAnalysis();
        } finally {
            setIsAnalyzingGaps(false);
        }
    };

    if (!isActive) return null;

    return (
        <div className="flex flex-col flex-1 overflow-hidden h-full bg-slate-900/40 relative">
            {/* Tool Selector */}
            <div className="flex gap-1 p-2 border-b border-white/5 bg-slate-900/60 backdrop-blur-md overflow-x-auto scrollbar-none">
                {activeTechnique === 'Spaced Repetition' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('review')}
                        className={`flex-1 text-xs whitespace-nowrap ${activeTab === 'review' ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-400'}`}
                    >
                        <Brain size={14} className="mr-1.5" /> Review
                    </Button>
                )}
                <div className="relative group flex-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('flashcards')}
                        className={`w-full text-xs ${activeTab === 'flashcards' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'}`}
                    >
                        <Brain size={14} className="mr-1.5" /> Cards
                    </Button>

                    {/* Hover Info Tooltip (Spaced Repetition) */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-bottom scale-95 group-hover:scale-100 pointer-events-none">
                        <div className="space-y-3">
                            <section>
                                <h4 className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-1">MEANING</h4>
                                <p className="text-[10px] text-slate-200 leading-tight">
                                    An evidence-based learning technique that performs review of material at increasing intervals to leverage the spacing effect.
                                </p>
                            </section>
                            <section>
                                <h4 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">USE</h4>
                                <p className="text-[10px] text-slate-200 leading-tight">
                                    Generate key points from your notes and schedule them for review. Ideal for long-term retention of large amounts of info.
                                </p>
                            </section>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45 -mt-1"></div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 text-xs ${activeTab === 'map' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'}`}
                >
                    <Network size={14} className="mr-1.5" /> Map
                </Button>
                <div className="relative group flex-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('feynman')}
                        className={`w-full text-xs ${activeTab === 'feynman' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'}`}
                    >
                        <MessageSquare size={14} className="mr-1.5" /> Feynman
                    </Button>
                    
                    {/* Hover Info Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-bottom scale-95 group-hover:scale-100 pointer-events-none">
                        <div className="space-y-3">
                            <section>
                                <h4 className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-1">MEANING</h4>
                                <p className="text-[10px] text-slate-200 leading-tight">
                                    Explain concepts simply as if teaching to a child to identify gaps in your own understanding.
                                </p>
                            </section>
                            <section>
                                <h4 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">USE</h4>
                                <p className="text-[10px] text-slate-200 leading-tight">
                                    Identify knowledge gaps by stripping away complex jargon and simplifying into a clear narrative.
                                </p>
                            </section>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45 -mt-1"></div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('gaps')}
                    className={`flex-1 text-xs ${activeTab === 'gaps' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'}`}
                >
                    <Target size={14} className="mr-1.5" /> Gaps
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">

                {/* FLASHCARDS TAB */}
                {activeTab === 'flashcards' && (
                    <div className="h-full flex flex-col">
                        {flashcards.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center ring-1 ring-white/10">
                                    <Layers size={32} className="text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="text-slate-200 font-medium mb-1">No Flashcards Yet</h3>
                                    <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Generate cards from your shared notes to test your knowledge.</p>
                                </div>
                                <Button
                                    onClick={handleGenerateFlashcards}
                                    disabled={!notes || isGeneratingCards}
                                    className="w-full max-w-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none shadow-lg shadow-violet-900/20"
                                >
                                    {isGeneratingCards ? (
                                        <><Spinner size="sm" className="mr-2" /> Creating Deck...</>
                                    ) : (
                                        <><Wand2 size={16} className="mr-2" /> Generate from Notes</>
                                    )}
                                </Button>
                                {!notes && <p className="text-[10px] text-red-400/80">Upload notes in the 'Notes' tab first.</p>}
                                {!canPersistFlashcards && (
                                    <p className="text-[10px] text-amber-300/80">
                                        General room: generated flashcards are temporary for this session.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Deck</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGenerateFlashcards}
                                        className="h-6 text-[10px] text-violet-400 hover:text-violet-300 px-2"
                                        disabled={isGeneratingCards}
                                    >
                                        <Wand2 size={10} className="mr-1" /> Regenerate
                                    </Button>
                                </div>
                                <FlashcardDeck
                                    cards={flashcards}
                                    courseId={canPersistFlashcards ? courseId : undefined}
                                    onCardsChange={handleDeckCardsChange}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* MAP TAB */}
                {activeTab === 'map' && (
                    <div className="h-full flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
                                <Network size={16} className="text-emerald-400" /> Topic Topology
                            </h3>
                            <p className="text-xs text-slate-500">Visual mapping of current study concepts.</p>
                        </div>
                        <div className="flex-1 flex bg-slate-900/50 rounded-xl overflow-hidden ring-1 ring-white/5">
                            <KnowledgeMap topics={mapData} />
                        </div>
                    </div>
                )}

                {/* FEYNMAN TAB */}
                {activeTab === 'feynman' && (
                    <div className="h-full flex flex-col">
                        <FeynmanAssistant topic={topic || 'this concept'} notes={notes} />
                        <div className="mt-4 p-3 bg-violet-600/10 rounded-xl border border-violet-500/20">
                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                "If you want to master something, teach it. The Feynman Technique identifies gaps in your knowledge by challenging you to explain complex ideas in simple terms."
                            </p>
                        </div>
                    </div>
                )}

                {/* GAPS TAB */}
                {activeTab === 'gaps' && (
                    <div className="h-full flex flex-col animate-in fade-in-50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
                                    <Target size={16} className="text-rose-400" /> Collective Knowledge Gaps
                                </h3>
                                <p className="text-xs text-slate-500">AI insights on group struggles.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTriggerGaps}
                                disabled={isAnalyzingGaps}
                                className="h-7 text-[10px] border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                            >
                                {isAnalyzingGaps ? <Spinner size="sm" /> : <><RotateCcw size={10} className="mr-1" /> Refresh</>}
                            </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                            {(!knowledgeGaps || knowledgeGaps.length === 0) ? (
                                <div className="p-8 rounded-2xl border border-dashed border-slate-700 bg-slate-800/20 flex flex-col items-center justify-center text-center mt-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 ring-1 ring-emerald-500/20">
                                        <Target size={24} className="text-emerald-400" />
                                    </div>
                                    <p className="text-slate-300 font-medium text-sm">No Gaps Detected Yet</p>
                                    <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-[200px]">
                                        Discuss topics or upload notes to help the AI identify collective learning gaps.
                                    </p>
                                </div>
                            ) : (
                                knowledgeGaps.map((gap, idx) => (
                                    <div key={idx} className="group p-4 rounded-xl border border-rose-500/10 bg-gradient-to-br from-rose-500/5 to-transparent hover:from-rose-500/10 transition-all duration-300 flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform shadow-inner">
                                            <span className="text-rose-400 text-xs font-bold">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-rose-100">{gap}</p>
                                            <p className="text-[11px] text-rose-400/60 mt-2 leading-relaxed">
                                                <span className="text-rose-400/80 font-medium">Group Nudge:</span> This concept seems to be a common friction point. Try explaining it using the Feynman tool!
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* REVIEW TAB (Spaced Repetition) */}
                {activeTab === 'review' && (
                    <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2 mb-2">
                                <Brain size={16} /> Spaced Repetition
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Moving ideas from short-term to long-term memory via <b>Active Recall</b>.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Track New Concept</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newConceptInput}
                                    onChange={(e) => setNewConceptInput(e.target.value)}
                                    placeholder="Enter topic to revisit..."
                                    className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-1 ring-emerald-500/50 outline-none"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && newConceptInput.trim() && onTrackConcept) {
                                            onTrackConcept(newConceptInput.trim());
                                            setNewConceptInput('');
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        if (newConceptInput.trim() && onTrackConcept) {
                                            onTrackConcept(newConceptInput.trim());
                                            setNewConceptInput('');
                                        }
                                    }}
                                    disabled={!newConceptInput.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3"
                                >
                                    Track
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Review Items ({trackedConcepts.length})</h4>
                            
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                                {trackedConcepts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center">
                                        <Layers size={24} className="text-slate-700 mb-2" />
                                        <p className="text-xs text-slate-600 italic">No concepts tracked yet.<br/>Use the AI chat or the input above.</p>
                                    </div>
                                ) : (
                                    trackedConcepts.map((concept, idx) => (
                                        <div key={idx} className="p-3 bg-slate-800/40 border border-white/5 rounded-xl hover:border-emerald-500/30 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-xs text-slate-200 font-medium">{concept}</span>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyToolsPanel;
