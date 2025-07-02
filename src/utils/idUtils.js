/**
 * Utility functions for handling ID extraction from objects or strings
 */

/**
 * Extracts the ID from an object or returns the string if it's already an ID
 * @param {string|Object} idOrObject - Either a string ID or an object with _id property
 * @returns {string|null} The extracted ID or null if invalid
 */
export const extractId = (idOrObject) => {
  if (!idOrObject) {
    return null;
  }
  
  if (typeof idOrObject === 'string') {
    // Return the string if it's not empty and not '[object Object]'
    if (idOrObject.trim() === '' || idOrObject === '[object Object]') {
      console.warn('Invalid string ID:', idOrObject);
      return null;
    }
    return idOrObject;
  }
  
  if (typeof idOrObject === 'object' && idOrObject._id) {
    // Recursively extract ID from nested object
    return extractId(idOrObject._id);
  }
  
  // If it's an object but doesn't have _id, log warning and return null
  if (typeof idOrObject === 'object') {
    console.warn('Object passed without _id property:', idOrObject);
    return null;
  }
  
  // For other types, try to convert to string
  const stringValue = String(idOrObject);
  if (stringValue === '[object Object]') {
    console.warn('Cannot convert to valid ID:', idOrObject);
    return null;
  }
  
  return stringValue;
};

/**
 * Validates if a string is a valid MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Safely extracts and validates an ID
 * @param {string|Object} idOrObject - Either a string ID or an object with _id property
 * @returns {string|null} The extracted and validated ID, or null if invalid
 */
export const safeExtractId = (idOrObject) => {
  const id = extractId(idOrObject);
  return isValidObjectId(id) ? id : null;
};