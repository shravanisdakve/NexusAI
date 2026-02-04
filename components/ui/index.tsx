
import React, { useState } from 'react';
import { Clipboard, Check, X } from 'lucide-react';

// PageHeader Component
interface PageHeaderProps {
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
}
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon }) => (
    <div className="mb-8 flex items-start gap-4">
        {icon && <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-lg">{icon}</div>}
        <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="mt-2 text-slate-400 text-lg max-w-2xl">{subtitle}</p>
        </div>
    </div>
);

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
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
        };

        // Size styles
        const sizeStyles = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-6 py-3.5 text-base', // More generous padding
            lg: 'px-8 py-4 text-lg',
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
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md m-4 ring-1 ring-slate-700 p-6 transform transition-all duration-300 scale-95 opacity-0 animate-in"
                onClick={(e) => e.stopPropagation()}
                style={{ animationName: 'modal-enter', animationDuration: '0.2s', animationFillMode: 'forwards' }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
            <style>{`
                @keyframes modal-enter {
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
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
}
export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
    <div className={`bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}>
        {children}
    </div>
);

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
