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
    <div className="space-y-[46px]">
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 w-14 shrink-0" />
        ))}
      </div>
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-72 w-full" />
    </div>
  );
}

export default function FeedPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
      };

      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);

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
      <PageShell>
        <FeedSkeleton />
      </PageShell>
    );
  }

  if (!user) return null;

  return (
    <PageShell>
      <div className={isMobile ? '' : ''}>
        <p className="label-micro text-felt-gray">Today</p>
        <h1 className="section-whisper mt-4 mb-[46px]">The feed.</h1>

        <div className="space-y-[46px]">
          <Suspense fallback={<div className="skeleton h-20 w-full" />}>
            <StoriesContainer />
          </Suspense>

          <Suspense fallback={<div className="skeleton h-40 w-full" />}>
            <CreatePost />
          </Suspense>

          <div className="space-y-[46px]">
            {posts?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts?.length === 0 && (
              <p className="text-[16px] text-felt-gray">No posts yet. Be the first to post.</p>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
