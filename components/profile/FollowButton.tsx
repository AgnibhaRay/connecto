'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { doc, arrayUnion, arrayRemove, onSnapshot, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  onFollowUpdate?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, initialIsFollowing, onFollowUpdate }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to real-time updates for the follow status
  useEffect(() => {
    if (!auth.currentUser) return;

    const currentUserRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(currentUserRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const following = userData.following || [];
        setIsFollowing(following.includes(targetUserId));
      }
    });

    return () => unsubscribe();
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    if (!auth.currentUser) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (auth.currentUser.uid === targetUserId) {
      toast.error('You cannot follow yourself');
      return;
    }

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const targetUserRef = doc(db, 'users', targetUserId);

      if (isFollowing) {
        // Unfollow - use batch write for atomicity
        batch.update(currentUserRef, {
          following: arrayRemove(targetUserId)
        });
        batch.update(targetUserRef, {
          followers: arrayRemove(auth.currentUser.uid)
        });

        await batch.commit();
        onFollowUpdate?.(false);
        toast.success('Unfollowed successfully');
      } else {
        // Follow - use batch write for atomicity
        batch.update(currentUserRef, {
          following: arrayUnion(targetUserId)
        });
        batch.update(targetUserRef, {
          followers: arrayUnion(auth.currentUser.uid)
        });

        await batch.commit();
        onFollowUpdate?.(true);
        toast.success('Following successfully');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors 
        ${isFollowing 
          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Processing...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}