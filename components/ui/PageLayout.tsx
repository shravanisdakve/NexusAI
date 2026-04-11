import React from 'react';

interface PageLayoutProps {
    main: React.ReactNode;
    side?: React.ReactNode;
    mainClassName?: string;
    sideClassName?: string;
    containerClassName?: string;
}

/**
 * Standardized 16:9 Viewport-First Page Layout.
 * Features a primary workspace and an optional right rail.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({ 
    main, 
    side, 
    mainClassName = "", 
    sideClassName = "",
    containerClassName = ""
}) => {
    return (
        <div className={`h-full w-full overflow-hidden relative ${containerClassName}`}>
            <div className="page-grid h-full w-full">
                {/* Main Content Pane */}
                <main className={`scroll-region p-4 sm:p-6 lg:p-8 ${mainClassName}`}>
                    {main}
                </main>

                {/* Secondary Side Rail */}
                {side && (
                    <aside className={`hidden lg:block border-l border-white/5 bg-slate-900/20 scroll-region p-4 sm:p-6 lg:p-8 ${sideClassName}`}>
                        {side}
                    </aside>
                )}
            </div>
        </div>
    );
};

export default PageLayout;
