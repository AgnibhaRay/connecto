'use client';

import { useEffect, Suspense, lazy, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase/config';
import PostCard from '@/components/feed/PostCard';
import Navigation from '@/components/shared/Navigation';
import type { Post } from '@/types';

// Lazy load non-critical components
const CreatePost = lazy(() => import('@/components/feed/CreatePost'));

export default function FeedPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent));
      };
      
      // Initial check
      checkIfMobile();
      
      // Listen for resize events
      window.addEventListener('resize', checkIfMobile);
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);

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

  const posts = postsSnapshot?.docs.map((doc, index) => ({
    id: doc.id,
    ...doc.data(),
  })) as Post[] | undefined;

  // Log LCP completion event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLCPComplete = (e: Event) => {
        if ((e as CustomEvent).detail && window.performance && 'mark' in window.performance) {
          window.performance.mark('lcp-complete');
          
          // Report to analytics in production
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
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="container mx-auto max-w-2xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-8 w-full bg-gray-200 rounded"></div>
              </div>
              <div className="flex justify-end mt-4">
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
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
        <Suspense fallback={
          <div className="h-40 bg-white rounded-lg shadow p-4 mb-4 animate-pulse">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-8 w-full bg-gray-200 rounded"></div>
            </div>
            <div className="flex justify-end mt-4">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        }>
          <CreatePost />
        </Suspense>
        <div className="space-y-4">
          {posts?.map((post) => (
            <PostCard 
              key={post.id} 
              post={post}
            />
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