import { useState, useRef, useEffect } from 'react';
import { Users, MoreVertical, MessageSquare, Send } from 'lucide-react';

const COLORS = [
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-rose-400',   text: 'text-white' },
  { bg: 'bg-emerald-500',text: 'text-white' },
  { bg: 'bg-amber-400',  text: 'text-white' },
  { bg: 'bg-cyan-500',   text: 'text-white' },
];

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

export default function CollaboratorsPanel({ users = [], you = {}, messages = [], onSendMessage }) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const sorted = [...users].sort((a, b) => {
    if (a.id === you.id) return -1;
    if (b.id === you.id) return 1;
    return a.joinedAt - b.joinedAt;
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (chatInput.trim() && onSendMessage) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  return (
    <aside className="w-full lg:w-[320px] h-[400px] lg:h-full bg-white/90 border-t lg:border-t-0 lg:border-l border-slate-200/80 shrink-0 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-[13px]">
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          Collaborators
        </div>
      </div>

      {/* Online count */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {users.length} Online
          </span>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 min-h-[100px] border-b border-slate-100">
        {sorted.map((user, idx) => {
          const isMe    = user.id === you.id;
          const color   = COLORS[idx % COLORS.length];
          const initials = getInitials(user.displayName);
          const isActive = user.activity && user.activity !== 'Idle' && user.activity !== 'Online';

          return (
            <div key={user.id} className="flex items-center gap-2.5 px-1 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${color.bg} ${color.text}`}>
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full block" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 truncate">
                  {user.displayName}
                  {isMe && <span className="text-slate-400 font-normal">(You)</span>}
                  {user.isOwner && <span className="text-amber-400 text-sm" title="Room Owner">👑</span>}
                </div>
                <div className={`text-[10px] font-medium mt-0.5 truncate ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {user.activity || (user.isOwner ? 'Owner' : 'Online')}
                </div>
              </div>

              <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col bg-slate-50/50 min-h-[100px]">
        <div className="px-4 py-2 border-b border-slate-100 bg-white/50 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.map((msg, i) => {
            const isMe = msg.userId === you.id;
            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] font-bold text-slate-400 mb-0.5 px-1">{isMe ? 'You' : msg.displayName}</span>
                <div className={`px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${isMe ? 'bg-indigo-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'} max-w-[90%] break-words shadow-sm`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-2 bg-white border-t border-slate-100 flex gap-1 shrink-0">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 min-w-0 bg-slate-100 border-none rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button type="submit" disabled={!chatInput.trim()} className="p-1.5 rounded-lg bg-indigo-500 text-white disabled:opacity-50 disabled:bg-slate-300 transition-colors shrink-0">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
