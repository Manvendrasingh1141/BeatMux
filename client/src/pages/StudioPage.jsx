import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getSocket } from '../services/socketService';
import { useSequencer } from '../hooks/useSequencer';
import TopNav           from '../components/studio/TopNav';
import Arranger         from '../components/studio/Arranger';
import Sequencer        from '../components/studio/sequencer/Sequencer';
import CollaboratorsPanel from '../components/studio/CollaboratorsPanel';
import BottomBar        from '../components/studio/BottomBar';

export default function StudioPage() {
  const { roomId }    = useParams();
  const { state: routeState } = useLocation();
  const initialData   = routeState || null;
  const you           = initialData?.you || {};
  const socket        = getSocket();

  const [users,      setUsers]      = useState(initialData?.roomState?.users || []);
  const [connStatus, setConnStatus] = useState('connected');

  useEffect(() => {
    if (!socket) return;

    const onConnect    = () => {
      setConnStatus('connected');
      socket.emit('room:join', { roomId, displayName: you.displayName });
    };
    const onDisconnect = () => setConnStatus('disconnected');

    const onUserJoined   = ({ users }) => setUsers(users);
    const onUserLeft     = ({ users }) => setUsers(users);
    const onUserActivity = ({ users }) => setUsers(users);
    const onRoomJoined   = ({ state }) => { if (state?.users) setUsers(state.users); };

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.io.on('reconnect_attempt', () => setConnStatus('reconnecting'));
    socket.on('user:joined',   onUserJoined);
    socket.on('user:left',     onUserLeft);
    socket.on('user:activity', onUserActivity);
    socket.on('room:joined',   onRoomJoined);

    return () => {
      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.io.off('reconnect_attempt');
      socket.off('user:joined',   onUserJoined);
      socket.off('user:left',     onUserLeft);
      socket.off('user:activity', onUserActivity);
      socket.off('room:joined',   onRoomJoined);
    };
  }, [socket, roomId, you.displayName]);

  const {
    pattern, isPlaying, bpm, currentStep, muted, soloed, volumes,
    tracks, quantize, patternBank, resolution,
    togglePlay, stop, toggleStep, clearPattern, resetPattern,
    changeBpm, toggleMute, toggleSolo, changeVolume, changeMasterVolume,
    changeQuantize, changePatternBank, changeResolution,
    addTrack, renameTrack, undo, redo, canUndo, canRedo,
  } = useSequencer(initialData?.roomState?.state || null);

  if (!initialData) return null;

  return (
    /* Same grid background as landing page */
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#f5f6fa',
        backgroundImage: `
          linear-gradient(to right, #dde0ee 1px, transparent 1px),
          linear-gradient(to bottom, #dde0ee 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      <TopNav
        roomId={roomId}
        isPlaying={isPlaying}
        bpm={bpm}
        onTogglePlay={togglePlay}
        onStop={stop}
        onChangeBpm={changeBpm}
        userCount={users.length}
        connStatus={connStatus}
        you={you}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex-1 flex overflow-hidden">

        <main className="flex-1 flex flex-col px-8 py-6 gap-6 overflow-hidden min-w-0">
          <Arranger currentStep={currentStep} isPlaying={isPlaying} tracks={tracks} quantize={quantize} />

          <Sequencer
            pattern={pattern}
            currentStep={currentStep}
            muted={muted}
            soloed={soloed}
            volumes={volumes}
            tracks={tracks}
            quantize={quantize}
            patternBank={patternBank}
            resolution={resolution}
            onToggleStep={toggleStep}
            onToggleMute={toggleMute}
            onToggleSolo={toggleSolo}
            onChangeVolume={changeVolume}
            onChangeQuantize={changeQuantize}
            onChangePatternBank={changePatternBank}
            onChangeResolution={changeResolution}
            onAddTrack={addTrack}
            onRenameTrack={renameTrack}
            onClear={clearPattern}
            onReset={resetPattern}
          />
        </main>

        <CollaboratorsPanel users={users} you={you} />
      </div>

      <BottomBar
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onStop={stop}
        onChangeMasterVolume={changeMasterVolume}
      />
    </div>
  );
}
