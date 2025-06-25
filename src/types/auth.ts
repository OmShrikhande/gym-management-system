// Define User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Define credentials interface for registration and login
export interface UserCredentials {
  email: string;
  password: string;
  name?: string;
  role?: string;
}