'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import PageShell from '@/components/shared/PageShell';
import PostActions from '@/components/feed/PostActions';
import VerificationBadge from '@/components/shared/VerificationBadge';
import type { Post, UserProfile } from '@/types';

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
  const [authorVerified, setAuthorVerified] = useState(false);
  const [commentVerifications, setCommentVerifications] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    async function loadPost() {
      const postData = await getPost(resolvedParams.id);
      setPost(postData);
      
      if (postData) {
        // Fetch author verification status
        const authorSnap = await getDoc(doc(db, 'users', postData.authorId));
        if (authorSnap.exists()) {
          const authorData = authorSnap.data() as UserProfile;
          setAuthorVerified(authorData.isVerified || false);
        }

        // Fetch verification status for all commenters
        if (postData.comments) {
          const verificationStatus: Record<string, boolean> = {};
          await Promise.all(
            postData.comments.map(async (comment) => {
              const commenterSnap = await getDoc(doc(db, 'users', comment.authorId));
              if (commenterSnap.exists()) {
                const commenterData = commenterSnap.data() as UserProfile;
                verificationStatus[comment.authorId] = commenterData.isVerified || false;
              }
            })
          );
          setCommentVerifications(verificationStatus);
        }
      }
      
      setLoading(false);
    }
    loadPost();

    // Set up real-time listener
    const postRef = doc(db, 'posts', resolvedParams.id);
    const unsubscribe = onSnapshot(postRef, async (snapshot) => {
      if (snapshot.exists()) {
        const postData = { id: snapshot.id, ...snapshot.data() } as Post;
        setPost(postData);
        
        // Update verification status when post updates
        const authorSnap = await getDoc(doc(db, 'users', postData.authorId));
        if (authorSnap.exists()) {
          const authorData = authorSnap.data() as UserProfile;
          setAuthorVerified(authorData.isVerified || false);
        }

        // Update verification status for all commenters
        if (postData.comments) {
          const verificationStatus: Record<string, boolean> = {};
          await Promise.all(
            postData.comments.map(async (comment) => {
              const commenterSnap = await getDoc(doc(db, 'users', comment.authorId));
              if (commenterSnap.exists()) {
                const commenterData = commenterSnap.data() as UserProfile;
                verificationStatus[comment.authorId] = commenterData.isVerified || false;
              }
            })
          );
          setCommentVerifications(verificationStatus);
        }
      } else {
        setPost(null);
      }
    });

    return () => unsubscribe();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <PageShell title="Thread">
        <div className="space-y-3 p-4">
          <div className="flex items-center">
            <div className="skeleton h-8 w-8 rounded-full"></div>
            <div className="ml-3 space-y-2">
              <div className="skeleton h-3 w-32"></div>
              <div className="skeleton h-3 w-24"></div>
            </div>
          </div>
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-48 w-full rounded-[8px]"></div>
        </div>
      </PageShell>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <PageShell title="Thread">
      <div className="post-card">
        <div className="mb-3 flex items-center">
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <Image
              src={post.authorPhotoURL || '/images/default-avatar.png'}
              alt={post.authorName}
              className="avatar"
              fill
              sizes="32px"
            />
          </div>
          <div className="ml-2">
            <h2 className="flex items-center text-[13px] font-semibold text-ink">
              {post.authorName}
              {authorVerified && <VerificationBadge />}
            </h2>
            <p className="text-[13px] text-graphite">
              {formatDistanceToNow(convertTimestampToDate(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <p className="mb-3 text-[15px] leading-[21px] text-ink">{post.content}</p>

        {post.imageURL && !post.videoURL && (
          <div className="media-frame relative mb-3 h-80 bg-hover-mist">
            <Image
              src={post.imageURL}
              alt="Post attachment"
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        )}
        {post.videoURL && (
          <div className="media-frame relative mb-3 w-full">
            <video
              src={post.videoURL}
              controls
              className="w-full"
              style={{ maxHeight: '600px', objectFit: 'contain' }}
              preload="metadata"
            />
          </div>
        )}

        <PostActions post={post} />
      </div>

      <div className="border-t border-concrete px-4 py-4">
        <h3 className="mb-4 text-[13px] font-semibold text-ink">Comments</h3>
        <div className="space-y-4">
          {post.comments?.map((comment) => (
            <div key={comment.id} className="flex space-x-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image
                  src={comment.authorPhotoURL || '/images/default-avatar.png'}
                  alt={comment.authorName}
                  className="avatar"
                  fill
                  sizes="32px"
                />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-1">
                  <p className="text-[13px] font-semibold text-ink">{comment.authorName}</p>
                  {commentVerifications[comment.authorId] && <VerificationBadge />}
                </div>
                <p className="text-[15px] text-ink">{comment.content}</p>
                <p className="mt-1 text-[12px] font-bold text-graphite">
                  {formatDistanceToNow(convertTimestampToDate(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {(!post.comments || post.comments.length === 0) && (
            <p className="text-[13px] text-graphite">No comments yet. Be the first to comment.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}