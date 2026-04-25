import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

interface TopicData {
    name: string;
    strength: number; // 0 to 1
    details?: string[];
}

interface KnowledgeMapProps {
    topics: TopicData[];
}

const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ topics }) => {
    const width = 600;
    const height = 220; // Reduced height
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
        <div ref={containerRef} className="bg-slate-900/40 border border-white/[0.05] rounded-2xl p-4 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-violet-400" />
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                        Conceptual Mapping
                    </h4>
                </div>
                <div className="flex gap-3 text-[9px] font-bold uppercase tracking-tighter opacity-60">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mastered</div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Gap</div>
                </div>
            </div>

            <svg width="100%" height="160" viewBox={`0 0 ${width} 160`} className="mx-auto">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Linear Grid */}
                <line x1="50" y1="80" x2={width - 50} y2="80" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" strokeDasharray="4 4" />

                {/* Topic Nodes in a horizontal spread */}
                {topics.map((topic, i) => {
                    const x = 80 + (i * ((width - 160) / Math.max(1, topics.length - 1)));
                    const y = 80 + (i % 2 === 0 ? -25 : 25);
                    const nodeRadius = 16 + (topic.strength * 10);
                    const color = topic.strength > 0.7 ? '#10b981' : topic.strength > 0.4 ? '#f59e0b' : '#ef4444';

                    return (
                        <g
                            key={topic.name}
                            onMouseEnter={(e) => handleNodeHover(e, topic)}
                            onMouseMove={(e) => handleNodeHover(e, topic)}
                            onMouseLeave={() => setTooltip(null)}
                            className="cursor-help"
                        >
                            <line x1={x} y1="80" x2={x} y2={y} stroke={color} strokeWidth="1" opacity="0.2" />
                            <motion.circle
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.05, type: 'spring' }}
                                cx={x} cy={y} r={nodeRadius}
                                fill={color}
                                fillOpacity="0.1"
                                stroke={color}
                                strokeWidth="1.5"
                                filter="url(#glow)"
                            />
                            <text
                                x={x} y={y + (i % 2 === 0 ? -nodeRadius - 8 : nodeRadius + 14)}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize="9"
                                fontWeight="800"
                                className="uppercase tracking-tighter"
                            >
                                {topic.name.length > 12 ? topic.name.substring(0, 10) + '...' : topic.name}
                            </text>
                            <text
                                x={x} y={y + 3}
                                textAnchor="middle"
                                fill="white"
                                fontSize="9"
                                fontWeight="black"
                                className="pointer-events-none opacity-80"
                            >
                                {Math.round(topic.strength * 100)}%
                            </text>
                        </g>
                    );
                })}
            </svg>

            {tooltip && (
                <div
                    className="absolute z-20 w-48 rounded-xl border border-violet-500/30 bg-slate-950/95 p-2.5 text-[10px] text-slate-200 shadow-2xl pointer-events-none backdrop-blur-md"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <p className="font-black text-violet-400 uppercase tracking-widest mb-1">{tooltip.topic.name}</p>
                    <p className="text-slate-400">Proficiency: <span className="text-white font-bold">{Math.round(tooltip.topic.strength * 100)}%</span></p>
                </div>
            )}
        </div>
    );
};

export default KnowledgeMap;
