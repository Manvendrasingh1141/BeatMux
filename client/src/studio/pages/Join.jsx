import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomStore } from '../room.store';
import { apiClient } from '../../lib/axios';

const Join = () => {
  const { roomCode: paramRoomCode } = useParams();
  const navigate = useNavigate();
  const { joinRoom } = useRoomStore();

  const [roomCode, setRoomCode] = useState(paramRoomCode || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  // If there is a room code in URL, fetch basic info to preview
  useEffect(() => {
    if (paramRoomCode) {
      fetchRoomPreview(paramRoomCode);
    }
  }, [paramRoomCode]);

  const fetchRoomPreview = async (code) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/rooms/${code}`);
      if (data.success) {
        setRoomInfo(data.data.room);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch room info');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setError('');
    setLoading(true);
    try {
      await joinRoom(roomCode.trim().toUpperCase());
      navigate(`/studio/${roomCode.trim().toUpperCase()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join session');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
      
      <div className="w-full max-w-md bg-panel border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">BeatMux</h1>
          <p className="text-gray-400">Join a collaborative session</p>
        </div>

        {roomInfo ? (
          <div className="mb-6 bg-black/40 border border-white/5 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-1">{roomInfo.name}</h2>
            <p className="text-sm text-primary font-mono mb-4">{roomInfo.roomCode}</p>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              {roomInfo.memberCount} / {roomInfo.maxMembers} Members
            </div>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABX92K"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase mb-4"
              required
              maxLength={10}
            />
          </form>
        )}

        {error && (
          <div className="mb-6 text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-md text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={loading || (!roomCode.trim() && !roomInfo)}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {loading ? 'Joining...' : 'Join Session'}
        </button>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-white transition-colors">
            Cancel and return to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default Join;
