import React, { useRef, useEffect, useState } from 'react';
import { useAssetStore } from '../store/asset.store';
import { formatTime } from '../../timeline/utils/timeFormat';
import { useParams } from 'react-router-dom';
import { validateAudioFile } from '../../../lib/validation';

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const StatusBadge = ({ status }) => {
  const variants = {
    UPLOADING:  'bg-sky-50 text-sky-600 border-sky-200',
    PROCESSING: 'bg-amber-50 text-amber-600 border-amber-200',
    READY:      'bg-emerald-50 text-emerald-600 border-emerald-200',
    FAILED:     'bg-red-50 text-red-600 border-red-200',
  };

  const cls = variants[status] ?? 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-widest uppercase ${cls}`}>
      {status}
    </span>
  );
};

const UploadProgressBar = ({ progress }) => (
  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
    <div
      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, progress ?? 0))}%` }}
    />
  </div>
);

const AssetBrowser = () => {
  const { roomCode } = useParams();
  const { assets, fetchAssets, uploadAsset, uploadProgress, processingStatus } = useAssetStore();
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (roomCode) fetchAssets(roomCode);
  }, [roomCode, fetchAssets]);

  const handleUploadClick = () => {
    setValidationError('');
    setPendingFile(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    const validationErrorMsg = validateAudioFile(file);
    if (validationErrorMsg) {
      setValidationError(validationErrorMsg);
      setPendingFile(null);
      return;
    }
    setValidationError('');
    setPendingFile({ name: file.name, size: file.size });
    uploadAsset(roomCode, file);
  };

  const handleDragStart = (e, asset) => {
    if (asset.waveformStatus !== 'READY') return;
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleRetry = () => {
    setValidationError('');
    setPendingFile(null);
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden font-sans">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
        <h3 className="text-xs font-black text-slate-400 tracking-widest">AUDIO LIBRARY</h3>
        <button onClick={handleUploadClick} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 text-xs rounded-lg transition-colors font-bold shadow-sm border border-indigo-100 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
          Upload
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
      </div>

      {(pendingFile || validationError) && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          {pendingFile && !validationError && (
            <p className="text-xs text-slate-500">
              Selected: <span className="text-slate-900 font-bold">{pendingFile.name}</span> <span className="text-slate-400">({formatFileSize(pendingFile.size)})</span>
            </p>
          )}
          {validationError && (
            <p className="text-xs text-red-500 font-bold">⚠ {validationError}</p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {assets.length === 0 && (
          <div className="p-6 text-xs font-bold text-slate-400 text-center border-2 border-dashed border-slate-100 rounded-xl m-2 bg-slate-50">
            No audio assets uploaded yet.
          </div>
        )}

        {assets.map((asset) => {
          const status = processingStatus[asset._id] || asset.waveformStatus;
          const progress = uploadProgress[asset._id];
          const isReady = status === 'READY';
          const isFailed = status === 'FAILED';

          return (
            <div key={asset._id} draggable={isReady} onDragStart={(e) => handleDragStart(e, asset)} className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all shadow-sm ${isReady ? 'cursor-grab border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md' : 'opacity-80 bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start gap-3">
                <span className="text-sm font-bold text-slate-700 truncate" title={asset.originalName}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" className="inline mr-1.5 mb-0.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  {asset.originalName}
                </span>
                <StatusBadge status={status} />
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-400 pl-5">
                <span>
                  {isReady ? formatTime(asset.duration) : '--:--'}
                  {asset.size ? <span className="ml-2 text-slate-300">{formatFileSize(asset.size)}</span> : null}
                </span>

                {isFailed && (
                  <button onClick={handleRetry} className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2">Retry</button>
                )}
              </div>

              {status === 'UPLOADING' && <UploadProgressBar progress={progress} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetBrowser;
