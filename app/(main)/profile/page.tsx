'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { doc, getDoc, query, collection, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import Navigation from '@/components/shared/Navigation';
import PostCard from '@/components/feed/PostCard';
import FollowButton from '@/components/profile/FollowButton';
import StartChat from '@/components/chat/StartChat';
import { Post, UserProfile } from '@/types';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import VerificationBadge from '@/components/shared/VerificationBadge';
import VerificationControls from '@/components/admin/VerificationControls';
import Image from 'next/image';

// Create a ProfileContent component that uses useSearchParams
function ProfileContent() {
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const searchParams = useSearchParams();
  const username = searchParams.get('username');

// Rest of the ProfileContent component
  // Subscribe to real-time user data updates
  useEffect(() => {
    if (!user) return;
    
    let unsubscribe: () => void;

    const setupUserSubscription = async () => {
      // If no username provided, use current user's username
      if (!username) {
        const currentUserRef = doc(db, 'users', user.uid);
        unsubscribe = onSnapshot(currentUserRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as UserProfile;
            setProfileUser(userData);
            setFollowerCount(userData.followers?.length || 0);
            setFollowingCount(userData.following?.length || 0);
          }
        });
        return;
      }

      // Find user by username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const targetUser = querySnapshot.docs[0];
        const targetUserId = targetUser.id;
        
        const targetUserRef = doc(db, 'users', targetUserId);
        unsubscribe = onSnapshot(targetUserRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as UserProfile;
            setProfileUser(userData);
            setFollowerCount(userData.followers?.length || 0);
            setFollowingCount(userData.following?.length || 0);

            // Check if current user is following this profile
            if (targetUserId !== user.uid) {
              setIsFollowing(userData.followers?.includes(user.uid) || false);
            }
          }
        });
      }
    };

    setupUserSubscription();
    return () => unsubscribe?.();
  }, [user, username]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!profileUser) return;
      
      try {
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef,
          where('authorId', '==', profileUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const userPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];

        setPosts(userPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [profileUser]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <p className="text-center text-gray-600">Please sign in to view profiles</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <p className="text-center text-gray-600">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = !username || profileUser.uid === user.uid;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <Image
                src={profileUser.photoURL || '/images/default-avatar.png'}
                alt={profileUser.displayName || 'Profile'}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full border-4 border-gray-100 mx-auto sm:mx-0"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {profileUser.displayName}
                  {profileUser.isVerified && <VerificationBadge />}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 mt-1 flex items-center gap-2">
                  @{profileUser.username}
                  {profileUser.isAdmin && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Admin
                    </span>
                  )}
                </p>
                {!isOwnProfile && (
                  <div className="mt-2 flex gap-2">
                    <FollowButton
                      targetUserId={profileUser.uid}
                      initialIsFollowing={isFollowing}
                      onFollowUpdate={setIsFollowing}
                    />
                    <StartChat targetUserId={profileUser.uid} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Profile
                </Link>
              ) : user?.uid && (
                <VerificationControls targetUser={profileUser} />
              )}
            </div>
          </div>

          <div className="flex space-x-6 text-center border-t border-gray-200 pt-6">
            <div>
              <span className="block text-2xl font-bold text-gray-900">{followerCount}</span>
              <span className="block text-sm text-gray-500">Followers</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-gray-900">{followingCount}</span>
              <span className="block text-sm text-gray-500">Following</span>
            </div>
          </div>
          
          {profileUser.bio && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="text-gray-600">{profileUser.bio}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            {isOwnProfile ? 'Your Posts' : `${profileUser.displayName}'s Posts`}
          </h2>

          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-600">
                {isOwnProfile 
                  ? "You haven't created any posts yet."
                  : "This user hasn't created any posts yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main profile page component with Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="flex items-center mb-6">
                <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-6 w-40 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}