import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { Button } from './ui';
import Flashcard from './Flashcard';

interface Card {
    front: string;
    back: string;
}

interface FlashcardDeckProps {
    cards: Card[];
    title?: string;
}

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards: initialCards, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cards, setCards] = useState(initialCards);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleShuffle = () => {
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCurrentIndex(0);
    };

    if (cards.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-400">No flashcards available.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}

            <div className="relative w-full">
                <Flashcard
                    front={cards[currentIndex].front}
                    back={cards[currentIndex].back}
                />
            </div>

            <div className="flex items-center justify-between w-full gap-4">
                <Button onClick={handlePrev} variant="ghost" disabled={cards.length <= 1}>
                    <ChevronLeft size={20} />
                </Button>

                <span className="text-sm font-mono text-slate-400">
                    {currentIndex + 1} / {cards.length}
                </span>

                <Button onClick={handleShuffle} variant="ghost" title="Shuffle" className="text-slate-400 hover:text-violet-400">
                    <Shuffle size={16} />
                </Button>

                <Button onClick={handleNext} variant="ghost" disabled={cards.length <= 1}>
                    <ChevronRight size={20} />
                </Button>
            </div>
        </div>
    );
};

export default FlashcardDeck;
