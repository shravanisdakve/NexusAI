import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'outline';
    };
    tips?: string[];
    className?: string;
}

/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states with:
 * - Illustrative icons
 * - Clear messaging
 * - Call-to-action buttons
 * - Helpful onboarding tips
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileText}
 *   title="No notes yet"
 *   description="Start by creating your first note or uploading a file"
 *   action={{
 *     label: "Create Note",
 *     onClick: () => setIsModalOpen(true)
 *   }}
 *   tips={[
 *     "Upload PDFs, PPTX, or audio files",
 *     "AI will auto-generate flashcards",
 *     "Organize by course for easy access"
 *   ]}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    tips,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 ${className}`}>
            {/* Icon */}
            {Icon && (
                <div className="mb-6 p-6 bg-slate-800/50 rounded-2xl ring-1 ring-slate-700">
                    <Icon className="w-16 h-16 text-violet-400" strokeWidth={1.5} />
                </div>
            )}

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>

            {/* Description */}
            <p className="text-slate-400 max-w-md mb-6 text-base leading-relaxed">
                {description}
            </p>

            {/* Call to Action Button */}
            {action && (
                <Button
                    onClick={action.onClick}
                    variant={action.variant || 'primary'}
                    className="mb-8 px-6 py-3 text-base font-semibold"
                >
                    {action.label}
                </Button>
            )}

            {/* Helpful Tips */}
            {tips && tips.length > 0 && (
                <div className="bg-slate-800/30 rounded-xl p-6 max-w-lg ring-1 ring-slate-700/50">
                    <p className="text-sm font-semibold text-slate-300 mb-3">💡 Pro Tips:</p>
                    <ul className="space-y-2 text-left">
                        {tips.map((tip, index) => (
                            <li key={index} className="text-sm text-slate-400 flex items-start">
                                <span className="text-violet-400 mr-2 flex-shrink-0">•</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
