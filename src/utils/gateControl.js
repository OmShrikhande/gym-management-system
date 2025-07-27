import axios from 'axios';
import { toast } from 'sonner';

// API URL - Use environment variable or fallback to production
const API_URL = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api';

/**
 * Simple gate opening function for gym owners
 * Directly opens the gate and logs to Firestore like QR scanning
 */
export const openGate = async (user, token) => {
  if (!token || !user) {
    toast.error('Please log in to open the gate');
    return { success: false, message: 'Authentication required' };
  }

  if (user.role !== 'gym-owner') {
    toast.error('Only gym owners can directly open the gate');
    return { success: false, message: 'Insufficient permissions' };
  }

  try {
    // Show loading state
    toast.loading('Opening gate...', { id: 'gate-opening' });

    // For gym owners, we'll create a special direct access endpoint
    // that bypasses member verification and directly opens the gate
    const requestData = {
      gymOwnerId: user._id,
      ownerAccess: true, // Flag to indicate this is gym owner direct access
      timestamp: new Date().toISOString()
    };

    console.log('Opening gate with data:', requestData);

    // Try to use a direct gate opening endpoint first
    let response;
    try {
      response = await axios.post(`${API_URL}/attendance/owner-gate-access`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (endpointError) {
      // If the specific endpoint doesn't exist, fall back to the regular verify endpoint
      // but with gym owner accessing their own gym
      console.log('Owner gate access endpoint not available, using regular verify endpoint');
      
      const fallbackData = {
        gymOwnerId: user._id,
        memberId: user._id, // Gym owner accessing their own gym
        directAccess: true,
        timestamp: new Date().toISOString()
      };

      response = await axios.post(`${API_URL}/attendance/verify`, fallbackData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('Gate opening response:', response.data);
    
    // Log NodeMCU response if present (hardware gate control)
    if (response.data.nodeMcuResponse) {
      console.log('NodeMCU Gate Response:', response.data.nodeMcuResponse);
    }
    
    const isSuccess = response.data.status === 'success';

    if (isSuccess) {
      // Try to mark attendance as well
      try {
        const attendanceData = {
          gymOwnerId: user._id,
          memberId: user._id,
          ownerAccess: true,
          timestamp: new Date().toISOString()
        };

        const attendanceResponse = await axios.post(`${API_URL}/attendance/mark`, attendanceData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Attendance marked for gate opening:', attendanceResponse.data);
      } catch (attendanceError) {
        console.error('Error marking attendance for gate opening:', attendanceError);
        // Don't fail the main gate opening if attendance marking fails
      }

      toast.success('🚪 Gate opened successfully! Welcome to your gym.', {
        id: 'gate-opening',
        duration: 3000,
      });
      
      // Trigger refresh event similar to QR scanning
      window.dispatchEvent(new CustomEvent('gateOpened', { 
        detail: { userId: user._id, timestamp: new Date().toISOString() } 
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
 * Emergency gate opening function (for urgent situations)
 * Can be used by gym owners without full verification
 */
export const emergencyOpenGate = async (user, token, reason = 'Emergency access') => {
  if (!token || !user) {
    toast.error('Please log in to open the gate');
    return { success: false, message: 'Authentication required' };
  }

  if (user.role !== 'gym-owner') {
    toast.error('Only gym owners can use emergency gate access');
    return { success: false, message: 'Insufficient permissions' };
  }

  try {
    toast.loading('Emergency gate opening...', { id: 'emergency-gate' });

    // Direct API call to emergency gate endpoint (if exists)
    // For now, we'll use the same endpoint with emergency flag
    const requestData = {
      gymOwnerId: user._id,
      memberId: user._id,
      emergencyAccess: true,
      reason: reason
    };

    const response = await axios.post(`${API_URL}/attendance/emergency-access`, requestData, {
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
      
      return { success: true, message: response.data.message };
    } else {
      throw new Error(response.data.message || 'Emergency access failed');
    }

  } catch (error) {
    // If emergency endpoint doesn't exist, fall back to regular gate opening
    console.log('Emergency endpoint not available, using regular gate opening');
    return await openGate(user, token);
  }
};