'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase/config';
import Navigation from '@/components/shared/Navigation';
import CreatePost from '@/components/feed/CreatePost';
import PostCard from '@/components/feed/PostCard';
import type { Post } from '@/types';

export default function FeedPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Get posts with real-time updates
  const [postsSnapshot] = useCollection(
    query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  );

  const posts = postsSnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Post[] | undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-white rounded-lg shadow" />
            <div className="h-60 bg-white rounded-lg shadow" />
            <div className="h-60 bg-white rounded-lg shadow" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <CreatePost />
        <div className="space-y-4">
          {posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No posts yet. Be the first to post!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}