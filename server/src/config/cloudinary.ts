import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn('⚠️ Cloudinary is not configured; image uploads will be unavailable.');
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'community_platform/reports'
): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error('رفع الصور غير متاح: إعدادات Cloudinary غير مكتملة.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export { cloudinary, isCloudinaryConfigured };
