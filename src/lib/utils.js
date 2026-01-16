/**
 * Utility function to parse images from various formats
 * Handles: arrays, JSON strings, single URLs, and null values
 */
export const parseImages = (images) => {
  if (!images) return [];
  
  // If already an array, return it
  if (Array.isArray(images)) return images;
  
  // If string, try to parse as JSON
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // If JSON parse fails, treat as single URL string
      return [images];
    }
  }
  
  // Fallback for any other type
  return [];
};

/**
 * Utility to safely revoke object URLs
 */
export const revokeObjectURLs = (urls) => {
  if (Array.isArray(urls)) {
    urls.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }
};

/**
 * Debounce utility for function calls
 */
export const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};
