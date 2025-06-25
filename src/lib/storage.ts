// Local storage utility functions

/**
 * Get an item from localStorage with proper error handling
 * @param key The key to retrieve from localStorage
 * @param defaultValue Default value to return if key doesn't exist or parsing fails
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Set an item in localStorage with proper error handling
 * @param key The key to set in localStorage
 * @param value The value to store
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
  }
}

/**
 * Remove an item from localStorage with proper error handling
 * @param key The key to remove from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}