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
  const [messages,   setMessages]   = useState(initialData?.roomState?.messages || []);
  const [currentMusicName, setCurrentMusicName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [musicDuration, setMusicDuration] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    let animationFrameId;
    let startTimestamp = null;
    let initialElapsed = elapsedMs;

    if (isPlaying) {
      const tick = (timestamp) => {
        if (startTimestamp === null) startTimestamp = timestamp;
        const delta = timestamp - startTimestamp;
        // if no music duration, loop at 32s for visual
        const limit = musicDuration > 0 ? musicDuration * 1000 : 32000;
        setElapsedMs((initialElapsed + delta) % limit);
        animationFrameId = requestAnimationFrame(tick);
      };
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, musicDuration]);

  useEffect(() => {
    window.onAddMusic = async (file) => {
      try {
        let name = file.name;
        if (name.lastIndexOf('.') !== -1) name = name.substring(0, name.lastIndexOf('.'));
        name = name.substring(0, 6);
        setCurrentMusicName(name);
        if (window.audioEngineInstance) {
          await window.audioEngineInstance.loadMusic(file);
          setMusicDuration(window.audioEngineInstance._musicBuffer.duration);
        }
      } catch (err) { console.error(err); }
    };
  }, []);

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
    const onRoomJoined   = ({ state }) => { 
      if (state?.users) setUsers(state.users); 
      if (state?.state?.messages) setMessages(state.state.messages);
    };
    
    const onChatMessage  = (msg) => setMessages((prev) => [...prev, msg]);
    const onChatHistory  = (msgs) => setMessages(msgs);

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.io.on('reconnect_attempt', () => setConnStatus('reconnecting'));
    socket.on('user:joined',   onUserJoined);
    socket.on('user:left',     onUserLeft);
    socket.on('user:activity', onUserActivity);
    socket.on('room:joined',   onRoomJoined);
    socket.on('chat:message',  onChatMessage);
    socket.on('chat:history',  onChatHistory);

    return () => {
      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.io.off('reconnect_attempt');
      socket.off('user:joined',   onUserJoined);
      socket.off('user:left',     onUserLeft);
      socket.off('user:activity', onUserActivity);
      socket.off('room:joined',   onRoomJoined);
      socket.off('chat:message',  onChatMessage);
      socket.off('chat:history',  onChatHistory);
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

  const handleDownload = () => {
    if (isRecording) {
      setIsRecording(false);
      window.audioEngineInstance?.stopRecording();
    } else {
      setIsRecording(true);
      window.audioEngineInstance?.startRecording();
    }
  };

  const handleSendMessage = (text) => {
    if (!text.trim() || !socket) return;
    socket.emit('chat:send', { text });
  };

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
      <TopNav onDownload={handleDownload} isRecording={isRecording}
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

      <div className="flex-1 flex overflow-hidden h-full">
        <main className="flex-1 h-full flex flex-col justify-center px-8 py-6 gap-6 overflow-hidden min-w-0 bg-transparent relative">
            <Arranger currentStep={currentStep} isPlaying={isPlaying} tracks={tracks} quantize={quantize} pattern={pattern} elapsedMs={elapsedMs} musicDuration={musicDuration} bpm={bpm} />

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

        <CollaboratorsPanel users={users} you={you} messages={messages} onSendMessage={handleSendMessage} />
      </div>

      <BottomBar currentMusicName={currentMusicName} elapsedMs={elapsedMs} musicDuration={musicDuration} onResetElapsed={() => setElapsedMs(0)}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onStop={stop}
        onChangeMasterVolume={changeMasterVolume}
      />
    </div>
  );
}
