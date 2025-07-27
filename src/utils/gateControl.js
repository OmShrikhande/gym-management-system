import axios from 'axios';
import { toast } from 'sonner';

// API URL - Use environment variable or fallback to production
const API_URL = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api';

/**
 * Gate control function for gym owners and trainers
 * Updates Firebase status and logs to Firestore
 */
export const openGate = async (user, token) => {
  if (!token || !user) {
    toast.error('Please log in to control the gate');
    return { success: false, message: 'Authentication required' };
  }

  if (!['gym-owner', 'trainer'].includes(user.role)) {
    toast.error('Only gym owners and trainers can control the gate');
    return { success: false, message: 'Insufficient permissions' };
  }

  try {
    // Show loading state
    toast.loading('Opening gate...', { id: 'gate-opening' });

    // Use the new gate control endpoint
    const requestData = {
      status: true // true = open gate
    };

    console.log('Opening gate with data:', requestData);
    console.log('User role:', user.role);

    const response = await axios.post(`${API_URL}/gate/toggle`, requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Gate control response:', response.data);
    
    // Log NodeMCU response if present (hardware gate control)
    if (response.data.nodeMcuResponse) {
      console.log('NodeMCU Gate Response:', response.data.nodeMcuResponse);
    }
    
    const isSuccess = response.data.status === 'success';

    if (isSuccess) {
      const roleText = user.role === 'gym-owner' ? 'your gym' : 'the gym';
      const welcomeMessage = `🚪 Gate opened successfully! Welcome to ${roleText}.`;
      
      toast.success(welcomeMessage, {
        id: 'gate-opening',
        duration: 3000,
      });
      
      // Trigger refresh event similar to QR scanning
      window.dispatchEvent(new CustomEvent('gateOpened', { 
        detail: { 
          userId: user._id, 
          userRole: user.role,
          timestamp: new Date().toISOString(),
          gateStatus: true
        } 
      }));
      
      return { 
        success: true, 
        message: response.data.message || 'Gate opened successfully',
        data: response.data.data 
      };
    } else {
      toast.error(response.data.message || 'Failed to open gate', {
        id: 'gate-opening',
        duration: 5000,
      });
      return { 
        success: false, 
        message: response.data.message || 'Failed to open gate' 
      };
    }

  } catch (error) {
    console.error('Error opening gate:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to open gate. Please try again.';
    
    toast.error(errorMessage, {
      id: 'gate-opening',
      duration: 5000,
    });
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

/**
 * Gate closing function for gym owners and trainers
 * Updates Firebase status to closed
 */
export const closeGate = async (user, token) => {
  if (!token || !user) {
    toast.error('Please log in to control the gate');
    return { success: false, message: 'Authentication required' };
  }

  if (!['gym-owner', 'trainer'].includes(user.role)) {
    toast.error('Only gym owners and trainers can control the gate');
    return { success: false, message: 'Insufficient permissions' };
  }

  try {
    // Show loading state
    toast.loading('Closing gate...', { id: 'gate-closing' });

    // Use the new gate control endpoint
    const requestData = {
      status: false // false = close gate
    };

    console.log('Closing gate with data:', requestData);
    console.log('User role:', user.role);

    const response = await axios.post(`${API_URL}/gate/toggle`, requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Gate control response:', response.data);
    
    const isSuccess = response.data.status === 'success';

    if (isSuccess) {
      toast.success('🚪 Gate closed successfully!', {
        id: 'gate-closing',
        duration: 3000,
      });
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('gateClosed', { 
        detail: { 
          userId: user._id, 
          userRole: user.role,
          timestamp: new Date().toISOString(),
          gateStatus: false
        } 
      }));
      
      return { 
        success: true, 
        message: response.data.message || 'Gate closed successfully',
        data: response.data.data 
      };
    } else {
      toast.error(response.data.message || 'Failed to close gate', {
        id: 'gate-closing',
        duration: 5000,
      });
      return { 
        success: false, 
        message: response.data.message || 'Failed to close gate' 
      };
    }

  } catch (error) {
    console.error('Error closing gate:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to close gate. Please try again.';
    
    toast.error(errorMessage, {
      id: 'gate-closing',
      duration: 5000,
    });
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

/**
 * Emergency gate opening function (for urgent situations)
 * Can be used by gym owners and trainers without full verification
 */
export const emergencyOpenGate = async (user, token, reason = 'Emergency access') => {
  if (!token || !user) {
    toast.error('Please log in to open the gate');
    return { success: false, message: 'Authentication required' };
  }

  if (!['gym-owner', 'trainer'].includes(user.role)) {
    toast.error('Only gym owners and trainers can use emergency gate access');
    return { success: false, message: 'Insufficient permissions' };
  }

  try {
    toast.loading('Emergency gate opening...', { id: 'emergency-gate' });

    // Use the new emergency gate endpoint
    const requestData = {
      reason: reason
    };

    const response = await axios.post(`${API_URL}/gate/emergency`, requestData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      toast.success('🚨 Emergency gate access granted!', {
        id: 'emergency-gate',
        duration: 3000,
      });
      
      // Log emergency access
      console.log('Emergency gate access:', response.data);
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('emergencyGateOpened', { 
        detail: { 
          userId: user._id, 
          userRole: user.role,
          reason: reason,
          timestamp: new Date().toISOString()
        } 
      }));
      
      return { success: true, message: response.data.message };
    } else {
      throw new Error(response.data.message || 'Emergency access failed');
    }

  } catch (error) {
    console.error('Emergency gate error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Emergency gate access failed';
    
    toast.error(errorMessage, {
      id: 'emergency-gate',
      duration: 5000,
    });
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};