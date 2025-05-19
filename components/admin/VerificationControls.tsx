'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';
import type { UserProfile } from '@/types';
import { logActivity } from '@/lib/utils/activityLogger';

interface VerificationControlsProps {
  targetUser: UserProfile;
}

export default function VerificationControls({ targetUser }: VerificationControlsProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [localVerificationStatus, setLocalVerificationStatus] = useState(targetUser.isVerified);

  // Subscribe to admin status changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile;
        setIsAdmin(!!userData.isAdmin);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to target user verification status changes
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'users', targetUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile;
        setLocalVerificationStatus(userData.isVerified ?? false);
      }
    });

    return () => unsubscribe();
  }, [targetUser.uid]);

  const toggleVerification = async () => {
    if (!user) {
      toast.error('Please sign in to perform this action');
      return;
    }

    if (!isAdmin) {
      toast.error('Only administrators can verify users');
      return;
    }

    setIsUpdating(true);
    try {
      // The new verification status is the opposite of the current status
      const newVerificationStatus = !localVerificationStatus;
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, {
        isVerified: newVerificationStatus,
        updatedAt: serverTimestamp()
      });
      
      // Log the verification change activity
      await logActivity({
        action: 'user_verified',
        userId: user.uid,
        userName: user.displayName || user.email || 'unknown',
        targetId: targetUser.uid,
        details: `User verification ${newVerificationStatus ? 'granted' : 'removed'} for ${targetUser.displayName || targetUser.email}`
      });
      
      toast.success(localVerificationStatus ? 
        'User verification removed' : 
        'User verified successfully'
      );
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast.error('Failed to update verification status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <button
      onClick={toggleVerification}
      disabled={isUpdating}
      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isUpdating ? 'Updating...' : localVerificationStatus ? 'Remove Verification' : 'Verify User'}
    </button>
  );
}