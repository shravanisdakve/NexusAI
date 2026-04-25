import React from 'react';
import { Send } from 'lucide-react';
import { Input, Button } from '../ui';
import { type ChatMessage } from '../../types';

interface ChatPanelProps {
    messages: ChatMessage[];
    input: string;
    setInput: (val: string) => void;
    onSend: (val: string) => void;
    currentUser: any;
    chatEndRef: React.RefObject<HTMLDivElement>;
    typingUsers: string[];
}

const ChatPanel: React.FC<ChatPanelProps> = React.memo(({ messages, input, setInput, onSend, currentUser, chatEndRef, typingUsers }) => (
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: any, i: number) => (
                <div key={i} className={`flex flex-col ${msg.user?.email === currentUser?.email ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{msg.user?.displayName}</span>
                    <div className={`px-3 py-2 rounded-2xl text-xs max-w-[90%] ${msg.user?.email === currentUser?.email ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>{msg.parts[0].text}</div>
                </div>
            ))}
            <div ref={chatEndRef}></div>
        </div>
        
        {typingUsers.length > 0 && (
            <div className="px-4 py-1 flex items-center gap-2">
                <span className="text-[8px] font-black text-violet-400 uppercase animate-pulse">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
            </div>
        )}

        <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
                <Input id="room-chat-input" name="roomChatInput" aria-label="Message room" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSend(input)} placeholder="Message room..." className="h-9 bg-slate-800/50 border-white/5 text-xs" />
                <Button onClick={() => onSend(input)} size="sm" className="bg-violet-600"><Send size={14} /></Button>
            </div>
        </div>
    </div>
));

export default ChatPanel;
