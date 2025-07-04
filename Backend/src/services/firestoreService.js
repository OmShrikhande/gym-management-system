// services/firestoreService.js
import { db } from '../config/firebase.js';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

class FirestoreService {
  
  /**
   * Update member status to active in Firestore when QR scan is successful
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {Object} memberData - Member data from verification
   * @param {Object} gymData - Gym data from verification
   */
  async updateMemberStatusToActive(memberId, gymOwnerId, memberData, gymData) {
    try {
      const memberRef = doc(db, 'gym_members', memberId);
      
      // Data to update/create in Firestore
      const updateData = {
        memberId: memberId,
        gymOwnerId: gymOwnerId,
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

      // Check if document exists
      const docSnap = await getDoc(memberRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(memberRef, updateData);
        console.log(`✅ Firestore: Updated member ${memberId} status to active`);
      } else {
        // Create new document
        await setDoc(memberRef, {
          ...updateData,
          createdAt: serverTimestamp()
        });
        console.log(`✅ Firestore: Created new member ${memberId} with active status`);
      }

      // Update door status to true (open) for successful QR scan
      await this.updateDoorStatus(gymOwnerId, true);

      return {
        success: true,
        message: 'Member status updated to active in Firestore',
        data: {
          memberId,
          status: 'Active',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Firestore Error:', error);
      throw new Error(`Failed to update member status in Firestore: ${error.message}`);
    }
  }

  /**
   * Log QR scan attempt in Firestore
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {string} status - 'success' or 'failed'
   * @param {string} reason - Reason for the status
   */
  async logQRScanAttempt(memberId, gymOwnerId, status, reason) {
    try {
      const logRef = doc(db, 'qr_scan_logs', `${memberId}_${Date.now()}`);
      
      await setDoc(logRef, {
        memberId,
        gymOwnerId,
        status,
        reason,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      console.log(`📋 Firestore: QR scan logged - ${status} for member ${memberId}`);
      
      return {
        success: true,
        message: 'QR scan logged in Firestore'
      };

    } catch (error) {
      console.error('❌ Firestore Log Error:', error);
      // Don't throw error for logging failures - it's not critical
      return {
        success: false,
        message: `Failed to log QR scan: ${error.message}`
      };
    }
  }

  /**
   * Get member activity from Firestore
   * @param {string} memberId - Member's MongoDB ID
   */
  async getMemberActivity(memberId) {
    try {
      const memberRef = doc(db, 'gym_members', memberId);
      const docSnap = await getDoc(memberRef);
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: docSnap.data()
        };
      } else {
        return {
          success: false,
          message: 'Member not found in Firestore'
        };
      }

    } catch (error) {
      console.error('❌ Firestore Get Error:', error);
      throw new Error(`Failed to get member activity: ${error.message}`);
    }
  }

  /**
   * Update door status in Firestore
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {boolean} status - Door status (true = open, false = closed)
   */
  async updateDoorStatus(gymOwnerId, status) {
    try {
      const doorRef = doc(db, 'gym', 'doorstatus');
      
      await setDoc(doorRef, {
        status: status, // true for open, false for closed
        gymOwnerId: gymOwnerId,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log(`🚪 Firestore: Door status updated to ${status ? 'OPEN' : 'CLOSED'} for gym ${gymOwnerId}`);
      
      return {
        success: true,
        message: `Door status updated to ${status ? 'open' : 'closed'}`
      };

    } catch (error) {
      console.error('❌ Firestore Door Status Error:', error);
      throw new Error(`Failed to update door status in Firestore: ${error.message}`);
    }
  }

  /**
   * Update member status to inactive (for membership expiry, etc.)
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} reason - Reason for deactivation
   */
  async updateMemberStatusToInactive(memberId, reason = 'Membership expired') {
    try {
      const memberRef = doc(db, 'gym_members', memberId);
      
      await updateDoc(memberRef, {
        membershipStatus: 'Inactive',
        isActive: false,
        deactivationReason: reason,
        deactivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`⚠️ Firestore: Updated member ${memberId} status to inactive - ${reason}`);
      
      return {
        success: true,
        message: 'Member status updated to inactive in Firestore'
      };

    } catch (error) {
      console.error('❌ Firestore Deactivation Error:', error);
      throw new Error(`Failed to deactivate member in Firestore: ${error.message}`);
    }
  }
}

export default new FirestoreService();