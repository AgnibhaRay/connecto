'use client';

import { useState, Suspense, lazy, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase/config';
import PostCard from '@/components/feed/PostCard';
import PageShell from '@/components/shared/PageShell';
import type { Post } from '@/types';

const CreatePost = lazy(() => import('@/components/feed/CreatePost'));
const StoriesContainer = lazy(() => import('@/components/stories/StoriesContainer'));

function FeedSkeleton() {
  return (
    <div>
      <div className="flex gap-3 overflow-hidden border-b border-concrete px-4 py-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 w-14 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="skeleton mx-4 my-4 h-32" />
      <div className="skeleton mx-4 h-48" />
    </div>
  );
}

export default function FeedPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const [postsSnapshot] = useCollection(
    query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  );

  const posts = postsSnapshot?.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Post[] | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLCPComplete = (e: Event) => {
        if ((e as CustomEvent).detail && window.performance && 'mark' in window.performance) {
          window.performance.mark('lcp-complete');
          const lcpTime = window.performance.now();
          console.log(`LCP completed in: ${lcpTime}ms`);
        }
      };

      window.addEventListener('lcp-complete', handleLCPComplete);
      return () => window.removeEventListener('lcp-complete', handleLCPComplete);
    }
  }, []);

  if (loading) {
    return (
      <PageShell title="Home">
        <FeedSkeleton />
      </PageShell>
    );
  }

  if (!user) return null;

  return (
    <PageShell title="Home">
      <div className="border-b border-concrete px-4 py-3">
        <Suspense fallback={<div className="skeleton h-14 w-full rounded-full" />}>
          <StoriesContainer />
        </Suspense>
      </div>

      <Suspense fallback={<div className="skeleton m-4 h-32" />}>
        <CreatePost />
      </Suspense>

      <div>
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts?.length === 0 && (
          <p className="px-4 py-8 text-[15px] text-graphite">No posts yet. Be the first to post.</p>
        )}
      </div>
    </PageShell>
  );
}
