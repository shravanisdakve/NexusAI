import React, { useRef, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Eraser, Pencil, Trash2, Download } from 'lucide-react';
import { Button } from './ui';

interface WhiteboardProps {
    roomId: string;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ roomId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#8b5cf6'); // Violet 500
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // Initialize Socket
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
        socketRef.current.emit('join-room', roomId);

        socketRef.current.on('draw', (data: any) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.width;

            ctx.beginPath();
            ctx.moveTo(data.x0, data.y0);
            ctx.lineTo(data.x1, data.y1);
            ctx.stroke();
        });

        socketRef.current.on('clear-whiteboard', () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [roomId]);

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e.nativeEvent) {
            clientX = e.nativeEvent.touches[0].clientX;
            clientY = e.nativeEvent.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getMousePos(e);
        lastPos.current = { x, y };
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !lastPos.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const { x, y } = getMousePos(e);

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color; // Slate 900 for eraser
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        socketRef.current?.emit('draw', {
            roomId,
            x0: lastPos.current.x,
            y0: lastPos.current.y,
            x1: x,
            y1: y,
            color: tool === 'eraser' ? '#0f172a' : color,
            width: tool === 'eraser' ? 20 : lineWidth
        });

        lastPos.current = { x, y };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        socketRef.current?.emit('clear-whiteboard', roomId);
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-slate-700">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <div className="flex gap-2">
                    <Button
                        variant={tool === 'pencil' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setTool('pencil')}
                        className={tool === 'pencil' ? 'bg-violet-600' : ''}
                    >
                        <Pencil size={16} className="mr-2" /> Pencil
                    </Button>
                    <Button
                        variant={tool === 'eraser' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setTool('eraser')}
                        className={tool === 'eraser' ? 'bg-slate-600' : ''}
                    >
                        <Eraser size={16} className="mr-2" /> Eraser
                    </Button>
                    <input
                        id="whiteboard-color"
                        name="whiteboardColor"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={downloadCanvas} className="text-slate-400">
                        <Download size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-rose-400 hover:text-rose-300">
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>
            <div className="flex-1 relative bg-[#0f172a]">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800}
                    className="w-full h-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    );
};

export default Whiteboard;
