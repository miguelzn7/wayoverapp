/**
 * Centralized route constants
 * Use these instead of string literals for page navigation
 */
export const ROUTES = {
  WELCOME: 'welcome',
  SWIPE: 'swipe',
  BROWSE: 'browse',
  MESSAGES: 'messages',
  SELLER: 'seller',
  ADD_LISTING: 'addls',
  INSTAGRAM_IMPORT: 'insta-import',
  IMPORT_EDITOR: 'import-editor',
  ONBOARDING: 'onboarding',
  LISTING: 'listing',
};

/**
 * Constants for timing and layout
 */
export const CONSTANTS = {
  // Listing durations (in seconds)
  LIVE_LISTING_DURATION: 15 * 60, // 15 minutes
  DEFAULT_TIME_REMAINING: 900, // 15 minutes fallback
  
  // Layout & CSS
  MAX_CARD_HEIGHT: 800,
  SWIPE_ANIMATION_DURATION: 300, // milliseconds
  IMAGE_LAZY_LOAD_FADE_DURATION: 300, // milliseconds
  
  // Form constraints
  MAX_TAGS_PER_LISTING: 5,
  MAX_IMAGES_PER_LISTING: 10,
  
  // Upload/debounce
  UPLOAD_DEBOUNCE_DELAY: 300,
};

/**
 * Navigation helper - creates consistent navigation objects
 */
export const createNavigation = (onNavigateFn) => ({
  toWelcome: () => onNavigateFn(ROUTES.WELCOME),
  toSwipe: () => onNavigateFn(ROUTES.SWIPE),
  toBrowse: () => onNavigateFn(ROUTES.BROWSE),
  toMessages: () => onNavigateFn(ROUTES.MESSAGES),
  toSeller: (params) => onNavigateFn(ROUTES.SELLER, params),
  toAddListing: () => onNavigateFn(ROUTES.ADD_LISTING),
  toListing: (params) => onNavigateFn(ROUTES.LISTING, params),
});
