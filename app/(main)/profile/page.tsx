'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, query, collection, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import FollowButton from '@/components/profile/FollowButton';
import StartChat from '@/components/chat/StartChat';
import PageShell from '@/components/shared/PageShell';
import PostCard from '@/components/feed/PostCard';
import { Post, UserProfile } from '@/types';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import VerificationBadge from '@/components/shared/VerificationBadge';
import VerificationControls from '@/components/admin/VerificationControls';
import Image from 'next/image';
import UserListModal from '@/components/profile/UserListModal';

// Create a ProfileContent component that uses useSearchParams
function ProfileContent() {
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const searchParams = useSearchParams();
  const username = searchParams.get('username');

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
            setProfileUser({ ...userData, uid: snapshot.id });
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
            setProfileUser({ ...userData, uid: snapshot.id });
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

  // Fetch followers and following
  const fetchUserList = async (userIds: string[]) => {
    const users: UserProfile[] = [];
    for (const uid of userIds) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        users.push({ ...userDoc.data(), uid: userDoc.id } as UserProfile);
      }
    }
    return users;
  };

  // Handle opening followers modal
  const handleShowFollowers = async () => {
    if (profileUser?.followers?.length) {
      const followersList = await fetchUserList(profileUser.followers);
      setFollowers(followersList);
      setShowFollowers(true);
    }
  };

  // Handle opening following modal
  const handleShowFollowing = async () => {
    if (profileUser?.following?.length) {
      const followingList = await fetchUserList(profileUser.following);
      setFollowing(followingList);
      setShowFollowing(true);
    }
  };

  const isOwnProfile = !username || profileUser?.uid === user?.uid;

  if (!user) {
    return (
      <PageShell title="Profile">
        <p className="px-4 py-8 text-center text-[13px] text-graphite">Please sign in to view profiles</p>
      </PageShell>
    );
  }

  if (!profileUser) {
    return (
      <PageShell title="Profile">
        <p className="px-4 py-8 text-center text-[13px] text-graphite">User not found</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Profile">
      <div>
        <div className="border-b border-concrete px-4 py-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <Image
                src={profileUser.photoURL || '/images/default-avatar.png'}
                alt={profileUser.displayName || 'Profile'}
                width={80}
                height={80}
                className="avatar h-20 w-20"
              />
              <div>
                <h1 className="flex items-center gap-1 text-[15px] font-semibold text-ink">
                  {profileUser.displayName}
                  {profileUser.isVerified && <VerificationBadge />}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-[13px] text-graphite">
                  @{profileUser.username}
                  {profileUser.isAdmin && <span className="tag-pill">Admin</span>}
                </p>
                {!isOwnProfile && (
                  <div className="mt-3 flex gap-2">
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
                <Link href="/profile/edit" className="btn-ghost">
                  Edit Profile
                </Link>
              ) : user?.uid && (
                <VerificationControls targetUser={profileUser} />
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-6">
            <button onClick={handleShowFollowers} className="text-left">
              <span className="text-[13px] font-semibold text-ink">{followerCount}</span>
              <span className="ml-1 text-[13px] text-graphite">followers</span>
            </button>
            <button onClick={handleShowFollowing} className="text-left">
              <span className="text-[13px] font-semibold text-ink">{followingCount}</span>
              <span className="ml-1 text-[13px] text-graphite">following</span>
            </button>
          </div>

          {profileUser.bio && (
            <p className="mt-3 text-[15px] leading-[1.4] text-ink">{profileUser.bio}</p>
          )}
        </div>

        <div>
          {loading ? (
            <p className="px-4 py-8 text-[13px] text-graphite">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="px-4 py-8 text-[13px] text-graphite">
              {isOwnProfile
                ? "You haven't created any posts yet."
                : "This user hasn't created any posts yet."}
            </p>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <UserListModal
          isOpen={showFollowers}
          title="Followers"
          users={followers}
          onClose={() => setShowFollowers(false)}
        />
        <UserListModal
          isOpen={showFollowing}
          title="Following"
          users={following}
          onClose={() => setShowFollowing(false)}
        />
      </div>
    </PageShell>
  );
}

// Main profile page component with Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <PageShell title="Profile">
        <div className="animate-pulse space-y-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-20 w-20 rounded-full"></div>
            <div className="space-y-2">
              <div className="skeleton h-4 w-40"></div>
              <div className="skeleton h-3 w-24"></div>
            </div>
          </div>
        </div>
      </PageShell>
    }>
      <ProfileContent />
    </Suspense>
  );
}