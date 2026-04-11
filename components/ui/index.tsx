
import React, { useState } from 'react';
import { Clipboard, Check, X } from 'lucide-react';

// PageHeader Component
interface PageHeaderProps {
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
    className?: string;
}
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, className = '' }) => (
    <div className={`mb-10 flex flex-col md:flex-row items-start md:items-center gap-5 ${className}`}>
        {icon && (
            <div className="p-3.5 bg-violet-500/10 rounded-2xl border border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.1)] shrink-0">
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6 text-violet-400' })}
            </div>
        )}
        <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight italic uppercase">{title}</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">{subtitle}</p>
        </div>
    </div>
);

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', children, isLoading, variant = 'primary', size = 'md', fullWidth = false, disabled, ...props }, ref) => {

        // Variant styles
        const variantStyles = {
            primary: 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E6] hover:to-[#7C4DFF] text-white shadow-[0_8px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_24px_rgba(99,102,241,0.5)] active:scale-[0.98]',
            secondary: 'bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white shadow-sm',
            outline: 'bg-transparent border-[1.5px] border-violet-500 text-violet-400 hover:bg-violet-500/10 active:bg-violet-500/20',
            ghost: 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white',
            danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:bg-red-800 focus:ring-red-500',
            success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md active:bg-emerald-800 focus:ring-emerald-500',
            link: 'bg-transparent text-violet-400 hover:text-violet-300 underline-offset-4 hover:underline p-0 h-auto',
        };

        // Size styles
        const sizeStyles = {
            sm: 'px-4 py-2 text-ui',   // ~15px
            md: 'px-6 py-3.5 text-base', // 16px
            lg: 'px-8 py-4 text-lg',   // 18px
        };

        // Base styles - always applied
        const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';

        // Disabled styles
        const disabledStyles = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:transform hover:translateY-[-1px] active:translateY-[0px]';

        // Width
        const widthStyle = fullWidth ? 'w-full' : '';

        const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${disabledStyles}
      ${widthStyle}
      ${className}
    `.trim().replace(/\s+/g, ' ');

        return (
            <button
                ref={ref}
                className={combinedClassName}
                disabled={disabled || isLoading}
                aria-disabled={disabled || isLoading}
                aria-busy={isLoading}
                {...props}
            >
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

// Input Component
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`w-full bg-slate-800 border-2 border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${className}`}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

// Textarea Component
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={`w-full bg-slate-800 border-2 border-slate-600 rounded-lg py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-all duration-200 ${className}`}
                {...props}
            />
        );
    }
);

Textarea.displayName = 'Textarea';

// Select Component
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={`w-full bg-slate-800 border-2 border-slate-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ${className}`}
                {...props}
            />
        );
    }
);

Select.displayName = 'Select';

// Spinner Component
interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | number;
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
    let sizeClass = 'h-5 w-5';
    let style = {};

    if (typeof size === 'number') {
        style = { height: size, width: size };
        sizeClass = '';
    } else {
        const sizes = {
            sm: 'h-4 w-4',
            md: 'h-5 w-5',
            lg: 'h-8 w-8',
            xl: 'h-12 w-12'
        };
        sizeClass = sizes[size as keyof typeof sizes] || sizes.md;
    }

    return (
        <svg className={`animate-spin text-white ${sizeClass} ${className}`} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
};

// CodeBlock Component
interface CodeBlockProps {
    code: string;
}
export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Basic cleaning to remove markdown backticks and language identifier
    const cleanedCode = code.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '').trim();

    return (
        <div className="bg-slate-800 rounded-lg my-4 relative">
            <button onClick={handleCopy} className="absolute top-3 right-3 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors">
                {copied ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
            <pre className="p-4 overflow-x-auto text-sm text-slate-200 rounded-lg">
                <code className="font-mono">{cleanedCode}</code>
            </pre>
        </div>
    );
};

// Modal Component
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    idPrefix?: string;
    size?: 'md' | 'lg' | 'xl';
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    idPrefix, 
    size = 'md',
    className = ''
}) => {
    const generatedId = React.useId();
    const modalTitleId = idPrefix ? `${idPrefix}-title` : `modal-title-${generatedId}`;

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        md: 'max-w-md',      // 448px
        lg: 'max-w-2xl',     // 672px
        xl: 'max-w-4xl'      // 896px
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[6px] flex items-center justify-center z-[100] transition-opacity duration-300 p-4"
            aria-labelledby={modalTitleId}
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className={`bg-slate-900 rounded-[2rem] shadow-2xl w-full ${sizeClasses[size]} ring-1 ring-white/10 flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 opacity-0 animate-in ${className}`}
                onClick={(e) => e.stopPropagation()}
                style={{ animationName: 'modal-enter', animationDuration: '0.2s', animationFillMode: 'forwards' }}
            >
                {/* Sticky Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-white/[0.04] bg-slate-900 sticky top-0 z-20">
                    <h2 id={modalTitleId} className="text-xl font-black text-white italic uppercase tracking-tight">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {children}
                </div>
            </div>
            <style>{`
                @keyframes modal-enter {
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

// Toast Notification Component
export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = {
        success: 'bg-emerald-600',
        error: 'bg-rose-600',
        info: 'bg-violet-600'
    }[type];

    return (
        <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-right duration-300 min-w-[300px]`}>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                <X size={18} />
            </button>
        </div>
    );
};

// Card Component
interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'open';
}
export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default' }) => {
    const baseStyles = variant === 'default' 
        ? 'bg-slate-800/40 backdrop-blur-md border border-slate-700/50 shadow-xl p-6 hover:border-slate-600/50 hover:shadow-2xl transition-all duration-300' 
        : 'bg-transparent border-none shadow-none p-0';
        
    return (
        <div className={`${baseStyles} rounded-2xl ${className}`}>
            {children}
        </div>
    );
};

export const ToastContainer: React.FC<{ toasts: { id: string; message: string; type: any }[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
            <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={() => onRemove(toast.id)}
            />
        ))}
    </div>
);

// Tooltip Component (Simple Implementation)
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="tooltip-provider relative">{children}</div>
);

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement(child) && (child.type === TooltipTrigger || (child.props as any).asChild)) {
                    return React.cloneElement(child as React.ReactElement<any>, { isVisible });
                }
                if (React.isValidElement(child) && child.type === TooltipContent) {
                    return isVisible ? child : null;
                }
                return child;
            })}
        </div>
    );
};

export const TooltipTrigger: React.FC<{ children: React.ReactElement; asChild?: boolean; isVisible?: boolean }> = ({ children }) => {
    return children;
};

export const TooltipContent: React.FC<{ children: React.ReactNode; className?: string; side?: 'top' | 'right' | 'bottom' | 'left' }> = ({ children, className = '', side = 'top' }) => {
    const sideClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div className={`absolute ${sideClasses[side]} z-[60] animate-in fade-in slide-in-from-bottom-1 duration-200 ${className}`}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl min-w-[200px] text-left">
                {children}
                <div className={`absolute w-2 h-2 bg-slate-900 border-slate-700 rotate-45 ${
                    side === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1 border-r border-b' :
                    side === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l border-t' :
                    side === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t border-r' :
                    'right-full top-1/2 -translate-y-1/2 -mr-1 border-b border-l'
                }`}></div>
            </div>
        </div>
    );
};
