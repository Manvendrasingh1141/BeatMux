import { Users, MoreVertical } from 'lucide-react';

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

export default function CollaboratorsPanel({ users = [], you = {} }) {
  const sorted = [...users].sort((a, b) => {
    if (a.id === you.id) return -1;
    if (b.id === you.id) return 1;
    return a.joinedAt - b.joinedAt;
  });

  return (
    <aside className="w-56 bg-white/90 border-l border-slate-200/80 shrink-0 flex flex-col">
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
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center leading-snug">
          Share your Room ID to invite collaborators
        </p>
      </div>
    </aside>
  );
}
