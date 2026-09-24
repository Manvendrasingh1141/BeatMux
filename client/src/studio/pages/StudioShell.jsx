import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/auth.store';
import { useRoomStore } from '../room.store';
import { wsClient } from '../../realtime/websocket.client';
import { useWebSocketStore } from '../../realtime/websocket.store';
import Timeline from '../../modules/timeline/components/Timeline';
import AssetBrowser from '../../modules/assets/components/AssetBrowser';
import { audioEngine } from '../../modules/audio/audio.engine';
import { mixerEngine } from '../../modules/mixer/engine/mixer.engine';
import PerformanceDashboard from '../../modules/performance/PerformanceDashboard';
import '../../modules/performance/performance.store';

const StudioShell = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentRoom, loading, error, fetchRoom, clearRoom } = useRoomStore();
  const { presenceUsers, connectionState, syncState } = useWebSocketStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (roomCode) {
      import('../../modules/realtime/sync/timeline.sync').then(({ setupTimelineSyncListeners }) => {
        setupTimelineSyncListeners();
      });
      import('../../modules/transport/sync/transport.sync').then(({ setupTransportSyncListeners }) => {
        setupTransportSyncListeners();
      });
      import('../../modules/timeline/store/timeline.store').then(({ useTimelineStore }) => {
        useTimelineStore.getState().fetchTimeline(roomCode);
      });

      fetchRoom(roomCode).then(() => {
        wsClient.connect(roomCode);
      }).catch(() => {});
    }
    return () => {
      clearRoom();
      wsClient.disconnect();
      audioEngine.dispose();
      mixerEngine.dispose();
    };
  }, [roomCode]);

  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}/join/${roomCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold">Loading session...</div>;
  if (error || !currentRoom) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800"><h2 className="text-2xl font-bold">Access Denied</h2><button onClick={() => navigate('/dashboard')} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl">Return to Dashboard</button></div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-50">
        
        {/* Left: Logo & Badges */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div className="font-extrabold text-xl tracking-tight text-slate-900">BeatMux</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-xs font-bold">
              <span className={`w-2 h-2 rounded-full ${connectionState === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {connectionState === 'CONNECTED' ? 'Live' : 'Connecting'}
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 pl-1.5 pr-4 py-1 rounded-full">
              <div className="flex -space-x-1.5">
                {presenceUsers.slice(0, 3).map((pUser, i) => (
                  <div key={pUser.id} className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold z-10" style={{ zIndex: 10 - i }}>
                    {pUser.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-indigo-600">{presenceUsers.length} collaborators</span>
            </div>
          </div>
        </div>
        
        {/* Right: User Menu */}
        <div className="flex items-center gap-6">
          <button onClick={handleCopyInvite} className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied ? 'Copied' : 'Invite'}
          </button>
          
          <div className="flex gap-4">
            <button className="text-slate-400 hover:text-slate-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17v-6h-6"/><path d="M3 13a9 9 0 0 1 15-6.7L21 11"/><path d="M21 11a9 9 0 0 1-15 6.7L3 13"/></svg></button>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm cursor-pointer border border-slate-300" onClick={logout}>
            {user?.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar (Asset Browser morphed into matching style) */}
        <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 p-4 gap-6 overflow-y-auto">
          {/* Active Tab */}
          <div className="bg-indigo-50 text-indigo-700 font-bold rounded-xl px-4 py-3 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Studio
          </div>
          
          <AssetBrowser />
        </aside>

        {/* Center Timeline */}
        <div className="flex-1 flex flex-col relative z-0 min-w-0 overflow-hidden">
          <Timeline />
        </div>
      </div>
      
      <PerformanceDashboard />
    </div>
  );
};

export default StudioShell;
