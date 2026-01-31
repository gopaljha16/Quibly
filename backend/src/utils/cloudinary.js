const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer storage for avatars
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'discord-clone/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 512, height: 512, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
        ]
    }
});

// Multer storage for banners
const bannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'discord-clone/banners',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1920, height: 480, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' }
        ]
    }
});

// Multer storage for server icons
const serverIconStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'discord-clone/server-icons',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 256, height: 256, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' }
        ]
    }
});

// Multer storage for server banners
const serverBannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'discord-clone/server-banners',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1920, height: 480, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' }
        ]
    }
});

// Create multer instances
const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 8 * 1024 * 1024 } // 8MB limit
});

const uploadBanner = multer({
    storage: bannerStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadServerIcon = multer({
    storage: serverIconStorage,
    limits: { fileSize: 8 * 1024 * 1024 } // 8MB limit
});

const uploadServerBanner = multer({
    storage: serverBannerStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        if (!publicId) return { success: false, message: 'No public ID provided' };
        
        const result = await cloudinary.uploader.destroy(publicId);
        return { success: result.result === 'ok', result };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
};

// Upload image from base64
const uploadBase64 = async (base64String, folder = 'discord-clone/misc') => {
    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder,
            resource_type: 'auto'
        });
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary base64 upload error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    cloudinary,
    uploadAvatar,
    uploadBanner,
    uploadServerIcon,
    uploadServerBanner,
    deleteImage,
    uploadBase64
};
