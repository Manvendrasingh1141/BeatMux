import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, User, Users } from 'lucide-react';
import { connectSocket, destroySocket } from '../services/socketService';

export default function LandingPage() {
  const [displayName, setDisplayName] = useState('');
  const [roomId,      setRoomId]      = useState('');
  const [error,       setError]       = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    destroySocket();
  }, []);

  const setupSocketListeners = (socket) => {
    socket.once('room:created', ({ roomId, you, state }) => {
      navigate(`/room/${roomId}`, { state: { you, roomState: state, isCreator: true } });
    });
    socket.once('room:joined', ({ roomId, you, state }) => {
      navigate(`/room/${roomId}`, { state: { you, roomState: state, isCreator: false } });
    });
    socket.once('room:error', ({ message }) => {
      setError(message);
      setIsConnecting(false);
      destroySocket();
    });
    socket.once('connect_error', () => {
      setError('Unable to connect to the server.');
      setIsConnecting(false);
      destroySocket();
    });
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter your name first.'); return; }
    setError('');
    setIsConnecting(true);
    const socket = connectSocket();
    setupSocketListeners(socket);
    socket.emit('room:create', { displayName });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter your name first.'); return; }
    if (!roomId.trim())      { setError('Please enter a Room ID.'); return; }
    setError('');
    setIsConnecting(true);
    const socket = connectSocket();
    setupSocketListeners(socket);
    socket.emit('room:join', { roomId: roomId.trim(), displayName });
  };

  return (
    /* ── Full-screen background with dot/grid pattern ───────────────────── */
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        backgroundColor: '#f5f6fa',
        backgroundImage: `
          linear-gradient(to right, #d1d5e0 1px, transparent 1px),
          linear-gradient(to bottom, #d1d5e0 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Faint radial glow in the centre, matching reference */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(238,240,255,0.9) 0%, transparent 80%)',
        }}
      />

      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-[380px] bg-white rounded-2xl shadow-xl overflow-hidden"
        style={{ boxShadow: '0 8px 40px 0 rgba(80,80,180,0.10), 0 1.5px 4px 0 rgba(0,0,0,0.06)' }}
      >
        {/* Gradient top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #6c63ff 0%, #48cae4 100%)' }}
        />

        <div className="px-9 pt-8 pb-8">

          {/* Logo row */}
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c6fcd 0%, #5e60ce 100%)' }}
            >
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-none">
              BeatMux
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-center text-[13px] text-slate-400 font-normal mb-7 leading-snug">
            Real-Time Collaborative Audio Sequencer
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {/* YOUR NAME label */}
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-1.5">
            Your Name
          </label>

          {/* Name input */}
          <div className="relative mb-5">
            <User
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"
              strokeWidth={1.8}
            />
            <input
              type="text"
              placeholder="e.g. Manvendra"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              className="w-full pl-10 pr-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-300 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Create Room button */}
          <button
            onClick={handleCreateRoom}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-5"
            style={{
              background: isConnecting
                ? '#7c7ee0'
                : 'linear-gradient(90deg, #5e60ce 0%, #6c63ff 100%)',
              boxShadow: '0 4px 14px 0 rgba(94,96,206,0.35)',
            }}
          >
            <span className="text-lg leading-none font-light">+</span>
            {isConnecting ? 'Connecting…' : 'Create New Room'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              or join existing
            </span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Room ID input */}
          <input
            type="text"
            placeholder="ENTER ROOM ID (E.G. BM-123456)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-300 placeholder:text-xs placeholder:tracking-wider bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all mb-3"
          />

          {/* Join Room button */}
          <button
            onClick={handleJoinRoom}
            disabled={isConnecting}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.8} />
            <span>{isConnecting ? 'Connecting…' : 'Join Room'}</span>
            <ArrowRight className="w-4 h-4 text-slate-400 ml-auto shrink-0" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Footer note */}
      <p className="relative z-10 mt-6 text-[12px] text-slate-400 font-normal tracking-wide">
        No account required · Share a Room ID to collaborate
      </p>
    </div>
  );
}
