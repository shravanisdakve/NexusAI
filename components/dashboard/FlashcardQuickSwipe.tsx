import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { getFlashcards, updateFlashcard } from '../../services/notesService';
import { getCourses } from '../../services/courseService';
import { Button } from '../ui';

const FlashcardQuickSwipe: React.FC = () => {
    const [cards, setCards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [stats, setStats] = useState({ mastered: 0, reviews: 0 });

    useEffect(() => {
        const fetchLatestCards = async () => {
            setIsLoading(true);
            try {
                const courses = await getCourses();
                // Find a course with at least 3 flashcards
                let targetCards: any[] = [];
                for (const course of courses) {
                    const fetched = await getFlashcards(course.id);
                    if (fetched && fetched.length > 0) {
                        targetCards = fetched.slice(0, 5); // Just pick 5 for a quick session
                        break;
                    }
                }
                setCards(targetCards);
            } catch (error) {
                console.error('[FlashcardSwipe] Failed to fetch cards:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLatestCards();
    }, []);

    const handleSwipe = async (direction: 'left' | 'right') => {
        const currentCard = cards[currentIndex];
        if (!currentCard) return;

        const mastered = direction === 'right';
        
        // Update stats
        setStats(prev => ({
            mastered: prev.mastered + (mastered ? 1 : 0),
            reviews: prev.reviews + (!mastered ? 1 : 0)
        }));

        // Update in backend (in background)
        // updateFlashcard(courseId, currentCard.id, { bucket: mastered ? 4 : 1 });

        if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        } else {
            setSessionComplete(true);
        }
    };

    if (isLoading) return null;
    if (cards.length === 0) return null;

    if (sessionComplete) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:hidden p-6 bg-slate-900/60 rounded-3xl border border-emerald-500/20 text-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-emerald-500/30">
                        <Trophy className="text-emerald-400" size={32} />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Mini-Sprint Complete</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6 text-center">You mastered {stats.mastered} concepts in 60s</p>
                    
                    <div className="flex gap-4 w-full">
                        <Button 
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-widest text-[10px] h-10"
                        >
                            +50 XP Earned
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="lg:hidden space-y-4">
            <div className="flex items-center justify-between px-1">
                <p className="eyebrow-label-accent flex items-center gap-2">
                    <Brain size={12} /> Memory Power-Up
                </p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {currentIndex + 1} / {cards.length}
                </p>
            </div>

            <div className="relative h-[250px] w-full mt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ x: 300, opacity: 0, rotate: 10 }}
                        animate={{ x: 0, opacity: 1, rotate: 0 }}
                        exit={{ x: -300, opacity: 0, rotate: -10 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="absolute inset-0 bg-slate-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-950/50 cursor-pointer overflow-hidden group"
                    >
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 p-32 bg-violet-600/5 blur-[60px] rounded-full pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col items-center h-full justify-between">
                            <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                                {isFlipped ? 'Response' : 'Concept'}
                            </span>
                            
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <h3 className={`text-lg font-bold text-white transition-all duration-300 px-4 leading-relaxed ${isFlipped ? 'italic text-indigo-200' : ''}`}>
                                    {isFlipped ? currentCard.back : currentCard.front}
                                </h3>
                            </div>

                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest animate-pulse mt-4">
                                Tap to reveal answer
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => handleSwipe('left')}
                    className="flex-1 h-14 bg-slate-900/40 rounded-2xl border border-rose-500/20 flex items-center justify-center gap-2 group hover:bg-rose-500/10 transition-colors"
                >
                    <XCircle className="text-rose-400 group-hover:scale-110 transition-transform" size={20} />
                    <span className="text-[10px] font-black text-rose-400/80 uppercase tracking-widest">Review</span>
                </button>
                <button
                    onClick={() => handleSwipe('right')}
                    className="flex-1 h-14 bg-slate-900/40 rounded-2xl border border-emerald-500/20 flex items-center justify-center gap-2 group hover:bg-emerald-500/10 transition-colors"
                >
                    <CheckCircle2 className="text-emerald-400 group-hover:scale-110 transition-transform" size={20} />
                    <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest">Know It</span>
                </button>
            </div>
        </div>
    );
};

export default FlashcardQuickSwipe;
