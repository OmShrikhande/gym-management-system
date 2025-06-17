// Define User interface
// export interface User {
//   id: string;
//   email: string;
//   name: string;
//   role: string;
// }

// Define credentials interface for registration and login
// export interface UserCredentials {
//   email: string;
//   password: string;
//   name?: string;
//   role?: string;
// }

// In JavaScript, we don't need to define interfaces, but we can document the expected shape
// of objects using JSDoc comments

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - User name
 * @property {string} role - User role
 */

/**
 * @typedef {Object} UserCredentials
 * @property {string} email - User email
 * @property {string} password - User password
 * @property {string} [name] - User name (optional)
 * @property {string} [role] - User role (optional)
 */