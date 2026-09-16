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
      <PageShell>
        <p className="text-center text-felt-gray">Please sign in to view profiles</p>
      </PageShell>
    );
  }

  if (!profileUser) {
    return (
      <PageShell>
        <p className="text-center text-felt-gray">User not found</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div>
        <div className="mb-[46px]">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div className="flex flex-col items-start gap-8 sm:flex-row">
              <Image
                src={profileUser.photoURL || '/images/default-avatar.png'}
                alt={profileUser.displayName || 'Profile'}
                width={96}
                height={96}
                className="avatar h-24 w-24"
              />
              <div>
                <p className="label-micro text-felt-gray">Profile</p>
                <h1 className="section-whisper mt-3 flex items-center gap-2">
                  {profileUser.displayName}
                  {profileUser.isVerified && <VerificationBadge />}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-[16px] text-felt-gray">
                  @{profileUser.username}
                  {profileUser.isAdmin && <span className="tag-pill">Admin</span>}
                </p>
                {!isOwnProfile && (
                  <div className="mt-6 flex gap-3">
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

          <div className="mt-10 flex gap-10 hairline-top pt-8">
            <button onClick={handleShowFollowers} className="text-left">
              <span className="block text-[29px] font-light text-obsidian">{followerCount}</span>
              <span className="label-micro text-felt-gray">Followers</span>
            </button>
            <button onClick={handleShowFollowing} className="text-left">
              <span className="block text-[29px] font-light text-obsidian">{followingCount}</span>
              <span className="label-micro text-felt-gray">Following</span>
            </button>
          </div>

          {profileUser.bio && (
            <p className="mt-8 max-w-xl text-[18px] leading-[1.21] text-inkstone">{profileUser.bio}</p>
          )}
        </div>

        <div>
          <h2 className="mb-[46px] text-[16px] text-obsidian">
            {isOwnProfile ? 'Your Posts' : `${profileUser.displayName}'s Posts`}
          </h2>

          {loading ? (
            <p className="text-felt-gray">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-felt-gray">
              {isOwnProfile
                ? "You haven't created any posts yet."
                : "This user hasn't created any posts yet."}
            </p>
          ) : (
            <div className="space-y-[46px]">
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
      <PageShell>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-8">
            <div className="skeleton h-24 w-24"></div>
            <div className="space-y-2">
              <div className="skeleton h-8 w-40"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
          </div>
        </div>
      </PageShell>
    }>
      <ProfileContent />
    </Suspense>
  );
}