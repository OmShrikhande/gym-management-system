// Local storage utility functions

/**
 * Get an item from localStorage with proper error handling
 * @param {string} key - The key to retrieve from localStorage
 * @param {*} defaultValue - Default value to return if key doesn't exist or parsing fails
 * @returns {*} The parsed value or the default value
 */
export function getStorageItem(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Set an item in localStorage with proper error handling
 * @param {string} key - The key to set in localStorage
 * @param {*} value - The value to store
 */
export function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
  }
}

/**
 * Remove an item from localStorage with proper error handling
 * @param {string} key - The key to remove from localStorage
 */
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}