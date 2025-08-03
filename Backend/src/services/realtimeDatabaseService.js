// services/realtimeDatabaseService.js
import { database } from '../config/firebase.js';
import { ref, set, update, get, push, serverTimestamp, query, orderByChild, equalTo, limitToLast, startAt, endAt } from 'firebase/database';

class RealtimeDatabaseService {
  
  /**
   * Update member status to active in Realtime Database when QR scan is successful
   * Path: gym/{gymOwnerId}/{memberId}
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {Object} memberData - Member data from verification
   * @param {Object} gymData - Gym data from verification
   */
  async updateMemberStatusToActive(memberId, gymOwnerId, memberData, gymData) {
    try {
      // Create reference to gym/{gymOwnerId}/{memberId}
      const memberRef = ref(database, `gym/${gymOwnerId}/${memberId}`);
      
      // Data to update/create in Realtime Database
      const updateData = {
        memberId: memberId,
        memberName: memberData.name,
        memberEmail: memberData.email,
        membershipStatus: 'Active',
        gymName: gymData.name,
        gymOwner: gymData.owner,
        lastQRScan: serverTimestamp(),
        lastAccessGranted: serverTimestamp(),
        isActive: true,
        updatedAt: serverTimestamp()
      };

      // Set the data (this will create or update the node)
      await set(memberRef, updateData);
      console.log(`✅ Realtime DB: Updated member ${memberId} status to active in gym/${gymOwnerId}/${memberId}`);

      // Update the gym status and latest member info
      const gymRef = ref(database, `gym/${gymOwnerId}`);
      await update(gymRef, {
        lastActiveMemberId: memberId,
        lastActiveMemberName: memberData.name,
        lastActiveTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update door status to true (open) for successful QR scan
      await this.updateDoorStatus(gymOwnerId, true);

      return {
        success: true,
        message: 'Member status updated to active in Realtime Database',
        path: `gym/${gymOwnerId}/${memberId}`,
        data: {
          memberId,
          status: 'Active',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Realtime DB Error:', error);
      throw new Error(`Failed to update member status in Realtime Database: ${error.message}`);
    }
  }

  /**
   * Log QR scan attempt in Realtime Database
   * Path: gym/{gymOwnerId}/scan_logs/{timestamp}_{memberId}
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {string} status - 'success' or 'failed'
   * @param {string} reason - Reason for the status
   */
  async logQRScanAttempt(memberId, gymOwnerId, status, reason) {
    try {
      // Create reference to gym/{gymOwnerId}/scan_logs
      const scanLogsRef = ref(database, `gym/${gymOwnerId}/scan_logs`);
      
      // Create a new log entry with timestamp
      const logData = {
        memberId,
        status,
        reason,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      // Push creates a new child with auto-generated key
      const newLogRef = push(scanLogsRef);
      await set(newLogRef, logData);

      console.log(`📋 Realtime DB: QR scan logged - ${status} for member ${memberId} in gym/${gymOwnerId}/scan_logs`);
      
      // Also update the main gym node with the latest scan info
      const gymRef = ref(database, `gym/${gymOwnerId}`);
      await update(gymRef, {
        lastScanMemberId: memberId,
        lastScanStatus: status,
        lastScanReason: reason,
        lastScanTimestamp: serverTimestamp()
      });
      
      return {
        success: true,
        message: 'QR scan logged in Realtime Database',
        path: `gym/${gymOwnerId}/scan_logs`
      };

    } catch (error) {
      console.error('❌ Realtime DB Log Error:', error);
      // Don't throw error for logging failures - it's not critical
      return {
        success: false,
        message: `Failed to log QR scan: ${error.message}`
      };
    }
  }

  /**
   * Check if member has already scanned successfully today
   * Path: gym/{gymOwnerId}/scan_logs
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   */
  async hasScannedToday(memberId, gymOwnerId) {
    try {
      // Get today's date timestamps
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();

      console.log(`🔍 Checking if member ${memberId} has scanned today for gym/${gymOwnerId}`);
      console.log(`📅 Today range: ${new Date(todayStart).toISOString()} to ${new Date(todayEnd).toISOString()}`);

      // Query scan logs for this member today
      const scanLogsRef = ref(database, `gym/${gymOwnerId}/scan_logs`);
      const todayScansQuery = query(
        scanLogsRef,
        orderByChild('timestamp'),
        startAt(todayStart),
        endAt(todayEnd)
      );

      const snapshot = await get(todayScansQuery);
      
      if (snapshot.exists()) {
        const logs = snapshot.val();
        
        // Filter for this member's successful scans
        const memberSuccessfulScans = Object.values(logs).filter(log => 
          log.memberId === memberId && log.status === 'success'
        );

        if (memberSuccessfulScans.length > 0) {
          const lastScan = memberSuccessfulScans[memberSuccessfulScans.length - 1];
          console.log(`⚠️ Member ${memberId} already scanned today at:`, new Date(lastScan.timestamp));
          
          return {
            hasScanned: true,
            lastScanTime: new Date(lastScan.timestamp),
            message: 'Member has already scanned successfully today'
          };
        }
      }

      console.log(`✅ Member ${memberId} has not scanned today yet`);
      return {
        hasScanned: false,
        message: 'Member can scan today'
      };

    } catch (error) {
      console.error('❌ Realtime DB Daily Scan Check Error:', error);
      // If there's an error checking, allow the scan to proceed (fail-safe)
      return {
        hasScanned: false,
        message: 'Error checking daily scan limit, allowing scan',
        error: error.message
      };
    }
  }

  /**
   * Get member activity from Realtime Database
   * Path: gym/{gymOwnerId}/{memberId}
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   */
  async getMemberActivity(memberId, gymOwnerId) {
    try {
      if (gymOwnerId) {
        // Get member from specific gym
        const memberRef = ref(database, `gym/${gymOwnerId}/${memberId}`);
        const snapshot = await get(memberRef);
        
        if (snapshot.exists()) {
          return {
            success: true,
            data: snapshot.val(),
            path: `gym/${gymOwnerId}/${memberId}`
          };
        } else {
          return {
            success: false,
            message: `Member not found in gym/${gymOwnerId}/${memberId}`
          };
        }
      } else {
        // Search across all gyms (less efficient but maintains compatibility)
        console.log('⚠️ Warning: Searching for member without specifying gym owner ID is less efficient');
        
        const gymsRef = ref(database, 'gym');
        const snapshot = await get(gymsRef);
        
        if (snapshot.exists()) {
          const gyms = snapshot.val();
          
          // Search through each gym for the member
          for (const [gymId, gymData] of Object.entries(gyms)) {
            if (gymData[memberId]) {
              return {
                success: true,
                data: gymData[memberId],
                gymOwnerId: gymId,
                path: `gym/${gymId}/${memberId}`
              };
            }
          }
        }
        
        return {
          success: false,
          message: 'Member not found in any gym'
        };
      }
    } catch (error) {
      console.error('❌ Realtime DB Get Error:', error);
      throw new Error(`Failed to get member activity: ${error.message}`);
    }
  }

  /**
   * Update door status in Realtime Database
   * Path: gym/{gymOwnerId}/status
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {boolean} status - Door status (true = open, false = closed)
   */
  async updateDoorStatus(gymOwnerId, status) {
    try {
      // Create reference to gym/{gymOwnerId}/status
      const statusRef = ref(database, `gym/${gymOwnerId}/status`);
      
      await set(statusRef, status);

      // Also update metadata
      const gymRef = ref(database, `gym/${gymOwnerId}`);
      await update(gymRef, {
        lastStatusUpdate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`🚪 Realtime DB: Door status updated to ${status ? 'OPEN' : 'CLOSED'} at gym/${gymOwnerId}/status`);
      
      return {
        success: true,
        message: `Door status updated to ${status ? 'open' : 'closed'}`,
        path: `gym/${gymOwnerId}/status`,
        status: status
      };

    } catch (error) {
      console.error('❌ Realtime DB Door Status Error:', error);
      throw new Error(`Failed to update door status in Realtime Database: ${error.message}`);
    }
  }

  /**
   * Update staff entry status in Realtime Database (for gym owners and trainers)
   * Path: gym/{gymOwnerId}/staff/{staffId}
   * @param {string} staffId - Staff's MongoDB ID (trainer or gym owner)
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {Object} staffData - Staff data from verification
   * @param {string} staffRole - 'trainer' or 'gym-owner'
   */
  async updateStaffEntryStatus(staffId, gymOwnerId, staffData, staffRole) {
    try {
      // Create reference to gym/{gymOwnerId}/staff/{staffId}
      const staffRef = ref(database, `gym/${gymOwnerId}/staff/${staffId}`);
      
      // Data to update/create in Realtime Database
      const updateData = {
        staffId: staffId,
        staffName: staffData.name,
        staffEmail: staffData.email,
        staffRole: staffRole,
        entryStatus: 'Active',
        gymName: staffData.gymName || 'Main Gym',
        lastEntry: serverTimestamp(),
        lastAccessGranted: serverTimestamp(),
        isActive: true,
        status: true,
        updatedAt: serverTimestamp()
      };

      // Set the data
      await set(staffRef, updateData);
      console.log(`✅ Realtime DB: Updated staff ${staffId} entry status to active in gym/${gymOwnerId}/staff/${staffId}`);

      // Update the main gym node with active staff info
      const gymRef = ref(database, `gym/${gymOwnerId}`);
      await update(gymRef, {
        lastActiveStaffId: staffId,
        lastActiveStaffName: staffData.name,
        lastActiveStaffRole: staffRole,
        lastActiveStaffTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update door status to true (open) for successful staff entry
      await this.updateDoorStatus(gymOwnerId, true);

      return {
        success: true,
        message: 'Staff entry status updated in Realtime Database',
        path: `gym/${gymOwnerId}/staff/${staffId}`,
        data: {
          staffId,
          status: true,
          entryStatus: 'Active',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Realtime DB Staff Entry Error:', error);
      throw new Error(`Failed to update staff entry status in Realtime Database: ${error.message}`);
    }
  }

  /**
   * Update member status to inactive (for membership expiry, etc.)
   * Path: gym/{gymOwnerId}/{memberId}
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {string} reason - Reason for deactivation
   */
  async updateMemberStatusToInactive(memberId, gymOwnerId, reason = 'Membership expired') {
    try {
      // Create reference to gym/{gymOwnerId}/{memberId}
      const memberRef = ref(database, `gym/${gymOwnerId}/${memberId}`);
      
      // Check if member exists
      const snapshot = await get(memberRef);
      
      if (snapshot.exists()) {
        // Update existing member
        await update(memberRef, {
          membershipStatus: 'Inactive',
          isActive: false,
          deactivationReason: reason,
          deactivatedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`✅ Realtime DB: Updated member ${memberId} status to inactive in gym/${gymOwnerId}/${memberId}`);
      } else {
        // Create new inactive record
        await set(memberRef, {
          memberId: memberId,
          membershipStatus: 'Inactive',
          isActive: false,
          deactivationReason: reason,
          deactivatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`✅ Realtime DB: Created new inactive member ${memberId} in gym/${gymOwnerId}/${memberId}`);
      }

      return {
        success: true,
        message: 'Member status updated to inactive in Realtime Database',
        path: `gym/${gymOwnerId}/${memberId}`,
        data: {
          memberId,
          status: 'Inactive',
          reason,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Realtime DB Deactivation Error:', error);
      throw new Error(`Failed to update member status to inactive: ${error.message}`);
    }
  }

  /**
   * Get door status from Realtime Database
   * Path: gym/{gymOwnerId}/status
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   */
  async getDoorStatus(gymOwnerId) {
    try {
      const statusRef = ref(database, `gym/${gymOwnerId}/status`);
      const snapshot = await get(statusRef);
      
      if (snapshot.exists()) {
        const status = snapshot.val();
        return {
          success: true,
          status: status,
          path: `gym/${gymOwnerId}/status`,
          message: `Door is currently ${status ? 'OPEN' : 'CLOSED'}`
        };
      } else {
        // Default to closed if no status exists
        return {
          success: true,
          status: false,
          path: `gym/${gymOwnerId}/status`,
          message: 'Door status not found, defaulting to CLOSED'
        };
      }
    } catch (error) {
      console.error('❌ Realtime DB Get Door Status Error:', error);
      throw new Error(`Failed to get door status: ${error.message}`);
    }
  }

  /**
   * Get all active members for a gym
   * Path: gym/{gymOwnerId}
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   */
  async getActiveMembers(gymOwnerId) {
    try {
      const gymRef = ref(database, `gym/${gymOwnerId}`);
      const snapshot = await get(gymRef);
      
      if (snapshot.exists()) {
        const gymData = snapshot.val();
        const activeMembers = [];
        
        // Filter out non-member data (status, staff, logs, etc.)
        Object.entries(gymData).forEach(([key, value]) => {
          // Check if this looks like member data (has memberId and membershipStatus)
          if (value && typeof value === 'object' && value.memberId && value.membershipStatus) {
            if (value.membershipStatus === 'Active' && value.isActive === true) {
              activeMembers.push({
                memberId: key,
                ...value
              });
            }
          }
        });
        
        return {
          success: true,
          data: activeMembers,
          count: activeMembers.length,
          path: `gym/${gymOwnerId}`
        };
      } else {
        return {
          success: true,
          data: [],
          count: 0,
          message: 'No gym data found'
        };
      }
    } catch (error) {
      console.error('❌ Realtime DB Get Active Members Error:', error);
      throw new Error(`Failed to get active members: ${error.message}`);
    }
  }
}

// Export singleton instance
const realtimeDatabaseService = new RealtimeDatabaseService();
export default realtimeDatabaseService;