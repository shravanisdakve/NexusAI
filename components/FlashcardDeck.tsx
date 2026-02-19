import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Brain, Check, X, Star, Zap } from 'lucide-react';
import { Button } from './ui';
import Flashcard from './Flashcard';
import { updateFlashcard } from '../services/notesService';
import { Flashcard as FlashcardType } from '../types';

interface FlashcardDeckProps {
    cards: FlashcardType[];
    title?: string;
    courseId?: string;
    onCardsChange?: (cards: FlashcardType[]) => void;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards: initialCards, title, courseId, onCardsChange }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cards, setCards] = useState(initialCards);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setCards(initialCards);
        setCurrentIndex((prev) => Math.min(prev, Math.max(0, initialCards.length - 1)));
    }, [initialCards]);

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleShuffle = () => {
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        onCardsChange?.(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const handleReview = async (quality: 'again' | 'hard' | 'good' | 'easy') => {
        if (cards.length === 0) return;

        const currentCard = cards[currentIndex];
        let newBucket = currentCard.bucket || 1;

        switch (quality) {
            case 'again': newBucket = 1; break;
            case 'hard': newBucket = Math.max(1, newBucket - 1); break;
            case 'good': newBucket = Math.min(5, newBucket + 1); break;
            case 'easy': newBucket = Math.min(5, newBucket + 2); break;
        }

        const reviewedAt = Date.now();
        const updatedCard: FlashcardType = {
            ...currentCard,
            bucket: newBucket,
            lastReview: reviewedAt
        };

        // Spaced repetition queue behavior:
        // difficult cards reappear sooner, easy cards much later.
        const sessionOffsetByQuality: Record<'again' | 'hard' | 'good' | 'easy', number> = {
            again: 1,
            hard: 2,
            good: Math.max(3, Math.min(6, cards.length - 1)),
            easy: Math.max(5, Math.min(10, cards.length - 1))
        };

        const reordered = [...cards];
        reordered.splice(currentIndex, 1);
        const insertAt = Math.min(reordered.length, sessionOffsetByQuality[quality]);
        reordered.splice(insertAt, 0, updatedCard);

        setCards(reordered);
        onCardsChange?.(reordered);
        setCurrentIndex(0);
        setIsFlipped(false);

        try {
            if (courseId) {
                await updateFlashcard(courseId, currentCard.id, {
                    bucket: newBucket,
                    lastReview: reviewedAt
                });
            }
        } catch (error) {
            console.error("Failed to update flashcard", error);
        }
    };

    if (cards.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-400">No flashcards available.</p>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center w-full px-2">
                {title && <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">{title}</h3>}
                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                    <Brain size={12} className="text-violet-400" />
                    <span className="text-[10px] text-slate-400 font-mono">
                        Bucket {currentCard.bucket || 1} / 5
                    </span>
                </div>
            </div>

            <div className="relative w-full perspective-lg">
                <Flashcard
                    front={currentCard.front}
                    back={currentCard.back}
                    onFlip={(flipped) => setIsFlipped(flipped)}
                />
            </div>

            {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button
                        onClick={() => handleReview('again')}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 transition-all group"
                    >
                        <X size={18} className="text-red-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-red-300 font-medium mt-1">Again</span>
                    </button>
                    <button
                        onClick={() => handleReview('hard')}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 transition-all group"
                    >
                        <AlertCircle size={18} className="text-orange-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-orange-300 font-medium mt-1">Hard</span>
                    </button>
                    <button
                        onClick={() => handleReview('good')}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 transition-all group"
                    >
                        <Check size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-emerald-300 font-medium mt-1">Good</span>
                    </button>
                    <button
                        onClick={() => handleReview('easy')}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 transition-all group"
                    >
                        <Zap size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-blue-300 font-medium mt-1">Easy</span>
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between w-full gap-4 px-2">
                    <Button
                        onClick={handlePrev}
                        variant="ghost"
                        size="sm"
                        disabled={cards.length <= 1}
                        className="text-slate-400 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </Button>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-mono text-slate-500">
                            {currentIndex + 1} / {cards.length}
                        </span>
                        <div className="flex gap-1 mt-1">
                            {cards.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 h-1 rounded-full transition-all ${i === currentIndex ? 'bg-violet-500 w-3' : 'bg-slate-700'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleShuffle} variant="ghost" size="sm" title="Shuffle" className="text-slate-400 hover:text-violet-400">
                            <Shuffle size={16} />
                        </Button>
                        <Button
                            onClick={handleNext}
                            variant="ghost"
                            size="sm"
                            disabled={cards.length <= 1}
                            className="text-slate-400 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </Button>
                    </div>
                </div>
            )}

            <p className="text-[10px] text-slate-500 italic text-center max-w-[200px]">
                Tip: If you find it easy, it will move to a higher bucket and appear less frequently.
            </p>
        </div>
    );
};

// Helper for AlertCircle as it was missing in imports
const AlertCircle = ({ size, className }: { size: number, className: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

export default FlashcardDeck;
