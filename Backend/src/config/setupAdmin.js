/**
 * This file is kept for backward compatibility.
 * The automatic super admin creation has been replaced with a secure registration process
 * that requires a secret key.
 */

export const setupSuperAdmin = async () => {
  console.log('Super admin creation is now handled through the secure registration endpoint');
  console.log('Use the /api/auth/register-super-admin endpoint with the correct secret key');
  return;
};

export default setupSuperAdmin;