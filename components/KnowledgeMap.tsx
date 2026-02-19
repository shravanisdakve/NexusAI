import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TopicData {
    name: string;
    strength: number; // 0 to 1
    details?: string[];
}

interface KnowledgeMapProps {
    topics: TopicData[];
}

const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ topics }) => {
    // Basic force-directed-ish layout or simple circular layout for SVG
    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 120;
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ topic: TopicData; x: number; y: number } | null>(null);

    const handleNodeHover = (event: React.MouseEvent<SVGGElement>, topic: TopicData) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.min(Math.max(16, event.clientX - rect.left + 12), rect.width - 220);
        const y = Math.min(Math.max(16, event.clientY - rect.top + 12), rect.height - 120);
        setTooltip({ topic, x, y });
    };

    return (
        <div ref={containerRef} className="bg-slate-900/50 rounded-3xl p-6 ring-1 ring-slate-700 overflow-hidden relative border border-slate-700/50">
            <h4 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                Knowledge Map
            </h4>

            <svg width="100%" height="400" viewBox={`0 0 ${width} ${height}`} className="mx-auto">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Draw Connections to Center */}
                {topics.map((topic, i) => {
                    const angle = (i / topics.length) * 2 * Math.PI;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);

                    return (
                        <line
                            key={`line-${i}`}
                            x1={centerX} y1={centerY}
                            x2={x} y2={y}
                            stroke="rgba(148, 163, 184, 0.2)"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Center Node */}
                <circle
                    cx={centerX} cy={centerY} r="10"
                    fill="#8b5cf6"
                    filter="url(#glow)"
                />

                {/* Topic Nodes */}
                {topics.map((topic, i) => {
                    const angle = (i / topics.length) * 2 * Math.PI;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);
                    const nodeRadius = 20 + (topic.strength * 15);
                    const color = topic.strength > 0.7 ? '#10b981' : topic.strength > 0.4 ? '#f59e0b' : '#ef4444';

                    return (
                        <g
                            key={topic.name}
                            onMouseEnter={(e) => handleNodeHover(e, topic)}
                            onMouseMove={(e) => handleNodeHover(e, topic)}
                            onMouseLeave={() => setTooltip(null)}
                            className="cursor-help"
                        >
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1, type: 'spring' }}
                                cx={x} cy={y} r={nodeRadius}
                                fill={color}
                                fillOpacity="0.2"
                                stroke={color}
                                strokeWidth="2"
                                filter="url(#glow)"
                            />
                            <text
                                x={x} y={y + nodeRadius + 20}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="12"
                                fontWeight="600"
                                className="pointer-events-none"
                            >
                                {topic.name}
                            </text>
                            <text
                                x={x} y={y + 4}
                                textAnchor="middle"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                                className="pointer-events-none"
                            >
                                {Math.round(topic.strength * 100)}%
                            </text>
                            <title>{`${topic.name}: ${Math.round(topic.strength * 100)}%`}</title>
                        </g>
                    );
                })}
            </svg>

            {tooltip && (
                <div
                    className="absolute z-20 w-56 rounded-xl border border-violet-500/30 bg-slate-950/95 p-3 text-[11px] text-slate-200 shadow-2xl pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <p className="font-semibold text-violet-300 mb-1">{tooltip.topic.name}</p>
                    <p className="text-slate-300 mb-2">Score: {Math.round(tooltip.topic.strength * 100)}%</p>
                    {(tooltip.topic.details || ['No additional explanation available']).map((line, idx) => (
                        <p key={`${tooltip.topic.name}-${idx}`} className="text-slate-400 leading-relaxed">
                            {line}
                        </p>
                    ))}
                </div>
            )}

            <div className="absolute bottom-6 right-6 flex gap-4 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Mastered</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Improving</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Gap Found</div>
            </div>
        </div>
    );
};

export default KnowledgeMap;
