import { v2 as cloudinary } from 'cloudinary';
import config from '../../config/config.js';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export const StorageService = {
  generateUploadSignature: (folder, publicId) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId
      },
      config.CLOUDINARY_API_SECRET
    );
    
    return { timestamp, signature, apiKey: config.CLOUDINARY_API_KEY, cloudName: config.CLOUDINARY_CLOUD_NAME };
  },

  getAssetUrl: (publicId) => {
    return cloudinary.url(publicId, { resource_type: 'video', secure: true });
  }
};
