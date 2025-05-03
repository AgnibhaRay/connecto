'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import Navigation from '@/components/shared/Navigation';
import PostActions from '@/components/feed/PostActions';
import type { Post } from '@/types';

interface FirestoreTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

type TimestampType = Date | FirestoreTimestamp | { seconds: number; nanoseconds: number } | string | null | undefined;

function convertTimestampToDate(timestamp: TimestampType): Date {
  if (!timestamp) return new Date();
  
  // Handle Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Handle Firestore Timestamp
  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  
  // Handle ISO string
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  
  // Handle seconds timestamp
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  
  return new Date();
}

async function getPost(id: string) {
  const postRef = doc(db, 'posts', id);
  const postSnap = await getDoc(postRef);
  
  if (!postSnap.exists()) {
    return null;
  }
  
  return {
    id: postSnap.id,
    ...postSnap.data()
  } as Post;
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    async function loadPost() {
      const postData = await getPost(resolvedParams.id);
      setPost(postData);
      setLoading(false);
    }
    loadPost();

    // Set up real-time listener
    const postRef = doc(db, 'posts', resolvedParams.id);
    const unsubscribe = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        setPost({
          id: doc.id,
          ...doc.data()
        } as Post);
      } else {
        setPost(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Author info */}
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 relative">
                <Image
                  src={post.authorPhotoURL || '/images/default-avatar.png'}
                  alt={post.authorName}
                  className="rounded-full"
                  fill
                  sizes="48px"
                />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{post.authorName}</h2>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(convertTimestampToDate(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Post content */}
            <p className="text-gray-900 text-lg mb-6">{post.content}</p>
            
            {/* Post image if exists */}
            {post.imageURL && (
              <div className="mb-6 relative h-96">
                <Image
                  src={post.imageURL}
                  alt="Post attachment"
                  className="rounded-lg object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            )}

            <PostActions post={post} />
          </div>

          {/* Comments section */}
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold mb-4">Comments</h3>
            <div className="space-y-4">
              {post.comments?.map((comment) => (
                <div key={comment.id} className="flex space-x-4">
                  <div className="h-10 w-10 relative">
                    <Image
                      src={comment.authorPhotoURL || '/images/default-avatar.png'}
                      alt={comment.authorName}
                      className="rounded-full"
                      fill
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="font-medium text-gray-900">{comment.authorName}</p>
                      <p className="text-gray-500">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(convertTimestampToDate(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {(!post.comments || post.comments.length === 0) && (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}