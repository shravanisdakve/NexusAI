import React, { useState, useEffect } from 'react';
import { Layers, Network, Brain, Wand2 } from 'lucide-react';
import { Button, Spinner } from './ui';
import FlashcardDeck from './FlashcardDeck';
import KnowledgeMap from './KnowledgeMap';
import FeynmanAssistant from './FeynmanAssistant';
import { generateFlashcards as generateFlashcardsApi } from '../services/geminiService';
import { getFlashcards, addFlashcards } from '../services/notesService';
import { Flashcard as FlashcardType } from '../types';

type ToolTab = 'flashcards' | 'map' | 'feynman';

interface StudyToolsPanelProps {
    notes: string;
    topic: string;
    isActive: boolean;
    courseId?: string;
}

const StudyToolsPanel: React.FC<StudyToolsPanelProps> = ({ notes, topic, isActive, courseId }) => {
    const [activeTab, setActiveTab] = useState<ToolTab>('flashcards');
    const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
    const [isGeneratingCards, setIsGeneratingCards] = useState(false);
    const [isFetchingCards, setIsFetchingCards] = useState(false);
    const [mapData, setMapData] = useState<any[]>([]);
    const canPersistFlashcards = !!courseId && courseId !== 'general';

    // Fetch existing flashcards
    useEffect(() => {
        const fetchCards = async () => {
            if (!canPersistFlashcards || !courseId) {
                setFlashcards([]);
                return;
            }

            setIsFetchingCards(true);
            try {
                const existing = await getFlashcards(courseId);
                if (existing && existing.length > 0) {
                    setFlashcards(existing);
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
    }, [courseId, canPersistFlashcards]);

    // Initialize Map Data based on topic (Mock)
    useEffect(() => {
        if (topic) {
            setMapData([
                { name: topic, strength: 1.0 },
                { name: 'Prior Knowledge', strength: 0.8 },
                { name: 'Core Concepts', strength: 0.4 },
                { name: 'Advanced Theory', strength: 0.1 },
            ]);
        }
    }, [topic]);

    const handleGenerateFlashcards = async () => {
        if (!notes) return;
        setIsGeneratingCards(true);
        try {
            const result = await generateFlashcardsApi(notes);
            const rawCards = JSON.parse(result);

            const enrichedCards: FlashcardType[] = rawCards.map((c: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                front: c.front,
                back: c.back,
                bucket: 1,
                lastReview: Date.now()
            }));

            if (canPersistFlashcards && courseId) {
                // Save to DB only for course-backed rooms.
                await addFlashcards(courseId, enrichedCards);
            }

            // Append to existing
            setFlashcards(prev => [...prev, ...enrichedCards]);
        } catch (error) {
            console.error("Failed to generate flashcards", error);
        } finally {
            setIsGeneratingCards(false);
        }
    };

    if (!isActive) return null;

    return (
        <div className="flex flex-col flex-1 overflow-hidden h-full bg-slate-900/40 relative">
            {/* Tool Selector */}
            <div className="flex gap-1 p-2 border-b border-white/5 bg-slate-900/60 backdrop-blur-md">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('flashcards')}
                    className={`flex-1 text-xs ${activeTab === 'flashcards' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'}`}
                >
                    <Layers size={14} className="mr-1.5" /> Cards
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 text-xs ${activeTab === 'map' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'}`}
                >
                    <Network size={14} className="mr-1.5" /> Map
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('feynman')}
                    className={`flex-1 text-xs ${activeTab === 'feynman' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400'}`}
                >
                    <Brain size={14} className="mr-1.5" /> Feynman
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
                                <FlashcardDeck cards={flashcards} courseId={canPersistFlashcards ? courseId : undefined} />
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
            </div>
        </div>
    );
};

export default StudyToolsPanel;
