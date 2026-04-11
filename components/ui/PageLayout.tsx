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
        <div className={`w-full min-w-0 min-h-0 ${containerClassName}`}>
            <div className="page-grid min-h-full w-full">
                {/* Main Content Pane */}
                <main className={`p-4 sm:p-6 lg:p-8 min-w-0 min-h-0 flex flex-col ${mainClassName}`}>
                    {main}
                </main>

                {/* Secondary Side Rail */}
                {side && (
                    <aside className={`hidden lg:block border-l border-white/5 bg-slate-900/20 min-w-0 min-h-0 ${sideClassName}`}>
                        <div className="sticky top-0 p-4 sm:p-6 lg:p-8">
                            {side}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default PageLayout;
