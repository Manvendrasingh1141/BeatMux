import { create } from 'zustand';
import { apiClient } from '../../../lib/axios';
import axios from 'axios';

export const useAssetStore = create((set, get) => ({
  assets: [],
  uploadProgress: {}, // assetId -> percentage
  processingStatus: {}, // assetId -> status string
  selectedAssetId: null,

  fetchAssets: async (roomCode) => {
    try {
      const { data } = await apiClient.get(`/rooms/${roomCode}/assets`);
      if (data.success) {
        set({ assets: data.data.assets });
      }
    } catch (error) {
      console.error('Failed to fetch assets', error);
    }
  },

  uploadAsset: async (roomCode, file) => {
    try {
      const tempId = Date.now().toString();

      // Add placeholder to state
      set((state) => ({
        uploadProgress: { ...state.uploadProgress, [tempId]: 0 },
        processingStatus: { ...state.processingStatus, [tempId]: 'UPLOADING' }
      }));

      // Upload directly to backend
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post(`/rooms/${roomCode}/assets/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          set((state) => ({
            uploadProgress: { ...state.uploadProgress, [tempId]: percentCompleted }
          }));
        }
      });

      if (res.data.success) {
        const uploadedAsset = res.data.data.asset;
        set((state) => ({
          assets: [uploadedAsset, ...state.assets],
          processingStatus: { ...state.processingStatus, [uploadedAsset._id]: 'READY' }
        }));
        
        // Auto-add to first track on timeline
        import('../../timeline/store/timeline.store').then(({ useTimelineStore }) => {
          const state = useTimelineStore.getState();
          const firstTrack = state.tracks[0];
          if (!firstTrack) return;
          
          import('../../realtime/sync/timeline.sync').then(({ sendClipCreate }) => {
            sendClipCreate({
              trackId: firstTrack.id,
              assetId: uploadedAsset._id,
              name: uploadedAsset.originalName,
              startTime: 0,
              duration: uploadedAsset.duration || 10,
              offset: 0,
              color: firstTrack.color
            });
          });
        });
      }
    } catch (error) {
      console.error('Upload failed', error);
    }
  },

  selectAsset: (assetId) => set({ selectedAssetId: assetId }),
}));
