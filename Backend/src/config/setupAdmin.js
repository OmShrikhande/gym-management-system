import User from '../models/userModel.js';

/**
 * Creates a super admin user if one doesn't already exist
 */
export const setupSuperAdmin = async () => {
  try {
    // Check if a super admin already exists
    const existingAdmin = await User.findOne({ role: 'super-admin' });
    
    if (existingAdmin) {
      console.log('Super admin already exists, skipping creation');
      return;
    }
    
    // Create a super admin user
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@gymflow.com',
      password: 'admin123456', // This should be changed after first login
      role: 'super-admin'
    });
    
    console.log('Super admin created successfully:', superAdmin.email);
    console.log('IMPORTANT: Please change the default password after first login');
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
};

export default setupSuperAdmin;