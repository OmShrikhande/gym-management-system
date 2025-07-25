// services/firestoreService.js
import { db } from '../config/firebase.js';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp, query, collection, where, getDocs, orderBy, limit } from 'firebase/firestore';

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
      // Create a reference to the gym owner's document
      const gymRef = doc(db, 'gym', gymOwnerId);
      
      // Create a members subcollection under the gym owner's document
      const membersCollectionRef = collection(gymRef, 'members');
      const memberRef = doc(membersCollectionRef, memberId);
      
      // Data to update/create in Firestore
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

      // Check if document exists
      const docSnap = await getDoc(memberRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(memberRef, updateData);
        console.log(`✅ Firestore: Updated member ${memberId} status to active in gym ${gymOwnerId}`);
      } else {
        // Create new document
        await setDoc(memberRef, {
          ...updateData,
          createdAt: serverTimestamp()
        });
        console.log(`✅ Firestore: Created new member ${memberId} with active status in gym ${gymOwnerId}`);
      }

      // Update the main gym owner document with active member count and latest member info
      await setDoc(gymRef, {
        lastActiveMemberId: memberId,
        lastActiveMemberName: memberData.name,
        lastActiveTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

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
      // Create a subcollection under the gym owner's document to store scan logs
      // Format: gym/{gymOwnerId}/scan_logs/{memberId}_{timestamp}
      const gymRef = doc(db, 'gym', gymOwnerId);
      const scanLogsCollectionRef = collection(gymRef, 'scan_logs');
      const logRef = doc(scanLogsCollectionRef, `${memberId}_${Date.now()}`);
      
      await setDoc(logRef, {
        memberId,
        status,
        reason,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      console.log(`📋 Firestore: QR scan logged - ${status} for member ${memberId} in gym ${gymOwnerId}`);
      
      // Also update the main gym owner document with the latest scan info
      await setDoc(gymRef, {
        lastScanMemberId: memberId,
        lastScanStatus: status,
        lastScanReason: reason,
        lastScanTimestamp: serverTimestamp()
      }, { merge: true });
      
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
   * Check if member has already scanned successfully today
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   */
  async hasScannedToday(memberId, gymOwnerId) {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      console.log(`🔍 Checking if member ${memberId} has scanned today for gym ${gymOwnerId}`);
      console.log(`📅 Today range: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);

      // Query for successful scans today in the gym owner's scan_logs subcollection
      const gymRef = doc(db, 'gym', gymOwnerId);
      const scanLogsCollectionRef = collection(gymRef, 'scan_logs');
      
      const q = query(
        scanLogsCollectionRef,
        where('memberId', '==', memberId),
        where('status', '==', 'success'),
        where('timestamp', '>=', todayStart),
        where('timestamp', '<', todayEnd),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      const hasScanned = !querySnapshot.empty;

      if (hasScanned) {
        const lastScan = querySnapshot.docs[0].data();
        console.log(`⚠️ Member ${memberId} already scanned today at:`, lastScan.timestamp?.toDate?.() || lastScan.timestamp);
        return {
          hasScanned: true,
          lastScanTime: lastScan.timestamp?.toDate?.() || lastScan.timestamp,
          message: 'Member has already scanned successfully today'
        };
      } else {
        console.log(`✅ Member ${memberId} has not scanned today yet`);
        return {
          hasScanned: false,
          message: 'Member can scan today'
        };
      }

    } catch (error) {
      console.error('❌ Firestore Daily Scan Check Error:', error);
      // If there's an error checking, allow the scan to proceed (fail-safe)
      return {
        hasScanned: false,
        message: 'Error checking daily scan limit, allowing scan',
        error: error.message
      };
    }
  }

  /**
   * Get member activity from Firestore
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   */
  async getMemberActivity(memberId, gymOwnerId) {
    try {
      // If gymOwnerId is provided, get member from that gym's subcollection
      if (gymOwnerId) {
        const gymRef = doc(db, 'gym', gymOwnerId);
        const membersCollectionRef = collection(gymRef, 'members');
        const memberRef = doc(membersCollectionRef, memberId);
        
        const docSnap = await getDoc(memberRef);
        
        if (docSnap.exists()) {
          return {
            success: true,
            data: docSnap.data()
          };
        } else {
          return {
            success: false,
            message: `Member not found in gym ${gymOwnerId}`
          };
        }
      } else {
        // If no gymOwnerId provided, search across all gyms (legacy support)
        // This is less efficient but maintains backward compatibility
        console.log('⚠️ Warning: Searching for member without specifying gym owner ID is less efficient');
        
        // Query all gym documents
        const gymsRef = collection(db, 'gym');
        const gymsSnapshot = await getDocs(gymsRef);
        
        // For each gym, check if the member exists
        for (const gymDoc of gymsSnapshot.docs) {
          const gymOwnerId = gymDoc.id;
          const membersCollectionRef = collection(doc(db, 'gym', gymOwnerId), 'members');
          const memberRef = doc(membersCollectionRef, memberId);
          
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
            return {
              success: true,
              data: memberSnap.data(),
              gymOwnerId: gymOwnerId
            };
          }
        }
        
        return {
          success: false,
          message: 'Member not found in any gym'
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
      // Use gymOwnerId as the document ID instead of 'doorstatus'
      const doorRef = doc(db, 'gym', gymOwnerId);
      
      await setDoc(doorRef, {
        status: status, // true for open, false = closed
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
   * Update staff entry status in Firestore (for gym owners and trainers)
   * @param {string} staffId - Staff's MongoDB ID (trainer or gym owner)
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {Object} staffData - Staff data from verification
   * @param {string} staffRole - 'trainer' or 'gym-owner'
   */
  async updateStaffEntryStatus(staffId, gymOwnerId, staffData, staffRole) {
    try {
      // Create a reference to the gym owner's document
      const gymRef = doc(db, 'gym', gymOwnerId);
      
      // Create a staff subcollection under the gym owner's document
      const staffCollectionRef = collection(gymRef, 'staff');
      const staffRef = doc(staffCollectionRef, staffId);
      
      // Data to update/create in Firestore
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
        status: true, // Set status as true as requested
        updatedAt: serverTimestamp()
      };

      // Check if document exists
      const docSnap = await getDoc(staffRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(staffRef, updateData);
        console.log(`✅ Firestore: Updated staff ${staffId} entry status to active in gym ${gymOwnerId}`);
      } else {
        // Create new document
        await setDoc(staffRef, {
          ...updateData,
          createdAt: serverTimestamp()
        });
        console.log(`✅ Firestore: Created new staff ${staffId} with active entry status in gym ${gymOwnerId}`);
      }

      // Update the main gym owner document with active staff info
      await setDoc(gymRef, {
        lastActiveStaffId: staffId,
        lastActiveStaffName: staffData.name,
        lastActiveStaffRole: staffRole,
        lastActiveStaffTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update door status to true (open) for successful staff entry
      await this.updateDoorStatus(gymOwnerId, true);

      return {
        success: true,
        message: 'Staff entry status updated in Firestore',
        data: {
          staffId,
          status: true,
          entryStatus: 'Active',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Firestore Staff Entry Error:', error);
      throw new Error(`Failed to update staff entry status in Firestore: ${error.message}`);
    }
  }

  /**
   * Update member status to inactive (for membership expiry, etc.)
   * @param {string} memberId - Member's MongoDB ID
   * @param {string} gymOwnerId - Gym owner's MongoDB ID
   * @param {string} reason - Reason for deactivation
   */
  async updateMemberStatusToInactive(memberId, gymOwnerId, reason = 'Membership expired') {
    try {
      // Create a reference to the gym owner's document
      const gymRef = doc(db, 'gym', gymOwnerId);
      
      // Create a members subcollection under the gym owner's document
      const membersCollectionRef = collection(gymRef, 'members');
      const memberRef = doc(membersCollectionRef, memberId);
      
      // Check if document exists
      const docSnap = await getDoc(memberRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(memberRef, {
          membershipStatus: 'Inactive',
          isActive: false,
          deactivationReason: reason,
          deactivatedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log(`⚠️ Firestore: Updated member ${memberId} status to inactive in gym ${gymOwnerId} - ${reason}`);
        
        // Update the main gym owner document with inactive member info
        await setDoc(gymRef, {
          lastInactiveMemberId: memberId,
          lastInactiveReason: reason,
          lastInactiveTimestamp: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        return {
          success: true,
          message: 'Member status updated to inactive in Firestore'
        };
      } else {
        console.log(`⚠️ Firestore: Member ${memberId} not found in gym ${gymOwnerId}`);
        return {
          success: false,
          message: `Member not found in gym ${gymOwnerId}`
        };
      }
    } catch (error) {
      console.error('❌ Firestore Deactivation Error:', error);
      throw new Error(`Failed to deactivate member in Firestore: ${error.message}`);
    }
  }
}

export default new FirestoreService();