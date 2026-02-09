/**
 * Image Optimization Utility
 * Optimizes images for faster loading, especially for international users
 */

// Size presets for different use cases
export const IMAGE_SIZES = {
    thumbnail: 150,
    avatar: 200,
    card: 250,  // Reduced from 400 to match browse/seller grid display size
    listing: 800,
    full: 1200,
};

/**
 * Optimizes image URLs with transformations
 * @param {string} url - Original image URL
 * @param {number|string} size - Size preset name or pixel width
 * @param {object} options - Additional options
 * @returns {string} Optimized image URL
 */
export const optimizeImage = (url, size = 'card', options = {}) => {
    // Handle invalid inputs
    if (!url || typeof url !== 'string') return '';

    // Handle blob URLs (local previews)
    if (url.startsWith('blob:')) return url;

    // Handle dicebear avatars (already optimized SVGs)
    if (url.includes('dicebear')) return url;

    // Get size in pixels
    const width = typeof size === 'string' ? IMAGE_SIZES[size] || IMAGE_SIZES.card : size;

    // Default options
    const {
        quality = 80,
        format = 'webp',
        fallback = true,
    } = options;

    // Check if it's a Supabase Storage URL
    // NOTE: Native Supabase transformations require the Pro plan. 
    // We comment this out to force the use of the external optimizer (wsrv.nl) which works for all plans.
    /*
    if (url.includes('supabase.co/storage')) {
        // Supabase has built-in image transformations
        // Add transformation parameters to the URL
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=${quality}&format=${format}`;
    }
    */

    // For external images, use wsrv.nl as a proxy/optimizer
    if (fallback) {
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=${format}`;
    }

    // Return original if no optimization applied
    return url;
};

/**
 * Generate a tiny blurred placeholder for progressive loading
 * @param {string} url - Original image URL
 * @returns {string} Placeholder image URL
 */
export const getPlaceholder = (url) => {
    if (!url || url.startsWith('blob:') || url.includes('dicebear')) {
        return url;
    }

    // Generate a very small (20px) blurred version for placeholder
    /*
    if (url.includes('supabase.co/storage')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=20&quality=30&blur=10`;
    }
    */

    // Use wsrv.nl for external images
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=20&q=30&blur=10`;
};

/**
 * Batch optimize multiple image URLs
 * @param {string[]} urls - Array of image URLs
 * @param {number|string} size - Size preset
 * @returns {string[]} Array of optimized URLs
 */
export const optimizeImages = (urls, size = 'card') => {
    if (!Array.isArray(urls)) return [];
    return urls.map(url => optimizeImage(url, size));
};
