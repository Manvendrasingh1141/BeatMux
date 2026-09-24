import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/auth.store';
import { useRoomStore } from '../room.store';
import { apiClient } from '../../lib/axios';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { createRoom } = useRoomStore();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('My Jam Session');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { fetchMyRooms(); }, []);

  const fetchMyRooms = async () => {
    try {
      const { data } = await apiClient.get('/rooms');
      if (data.success) setRooms(data.data.rooms);
    } catch (e) { console.error(e); }
    finally { setLoadingRooms(false); }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      const room = await createRoom(newRoomName);
      navigate(`/studio/${room.roomCode}`);
    } catch (e) { console.error(e); setIsCreating(false); }
  };

  const handleLogout = async () => {
    try { await apiClient.post('/auth/logout'); } catch (e) {}
    finally { logout(); }
  };

  return (
    <div
      className="min-h-screen bg-white font-sans text-slate-800 relative flex flex-col"
      style={{
        backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundColor: '#f8fafc'
      }}
    >
      {/* Wave */}
      <svg className="absolute bottom-0 w-full h-48 text-indigo-100/50 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <path fill="currentColor" d="M0,192L80,202.7C160,213,320,235,480,229.3C640,224,800,192,960,186.7C1120,181,1280,203,1360,213.3L1440,224L1440,320L0,320Z"/>
      </svg>

      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur border-b border-slate-200 px-8 h-16 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">BeatMux</span>
          <span className="text-[10px] font-bold text-indigo-500 tracking-widest border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded">Collaborative Studio</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Web Audio API + WebSockets
          </div>
          <div className="relative group">
            <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm cursor-pointer select-none">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100">
                <div className="font-bold text-sm text-slate-900">{user?.username}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-12 relative z-10">

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            Multi-Track Sequencer & Jam Room
          </div>
          <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight mb-2">
            Welcome back, <span className="text-indigo-600">{user?.username}</span>
          </h1>
          <p className="text-lg text-slate-500">Your collaborative music production studio.</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-12">
          <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Create New Session
          </button>
          <button onClick={() => navigate('/join')} className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all border border-slate-200 shadow-sm flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Join Session
          </button>
        </div>

        {/* Sessions */}
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Your Sessions</h2>

          {loadingRooms ? (
            <div className="text-slate-400 font-medium">Loading sessions...</div>
          ) : rooms.length === 0 ? (
            <div className="text-slate-500 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-4"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <p className="font-bold text-slate-400">No sessions yet</p>
              <p className="text-sm text-slate-300 mt-1">Create one or join an existing session to start producing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map(room => {
                const isHost = room.ownerId?._id === user?._id || room.ownerId === user?._id;
                return (
                  <div key={room._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col group shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-lg text-slate-900 mb-1 truncate max-w-[180px]">{room.name}</h3>
                        <p className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded inline-block">{room.roomCode}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${isHost ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                        {isHost ? 'Host' : 'Member'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-medium mb-5">
                      {room.settings?.bpm || 120} BPM · {room.members?.length || 1} member{room.members?.length !== 1 ? 's' : ''}
                    </div>

                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100">
                      <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                      <button onClick={() => navigate(`/studio/${room.roomCode}`)} className="text-sm font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Open Studio
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200/60 relative z-10 text-[11px] text-slate-400 font-medium tracking-wide">
        <p>© 2026 BeatMux Studio Inc. Real-Time Audio Production.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-600">Docs</a>
          <a href="#" className="hover:text-slate-600">Web Audio API</a>
          <a href="#" className="hover:text-slate-600">WebSocket API</a>
        </div>
      </footer>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-1">Create New Session</h3>
              <p className="text-sm text-slate-500 mb-6">Start a new collaborative jam room</p>
              <form onSubmit={handleCreateSession}>
                <div className="mb-6">
                  <label className="block text-xs font-black text-slate-700 tracking-wider mb-2">SESSION NAME</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2">
                    {isCreating ? 'Creating...' : (<>Create Session <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg></>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
