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
      <PageShell>
        <div className="space-y-4">
          <div className="flex items-center mb-6">
            <div className="skeleton h-12 w-12"></div>
            <div className="ml-4 space-y-2">
              <div className="skeleton h-4 w-32"></div>
              <div className="skeleton h-3 w-24"></div>
            </div>
          </div>
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-96 w-full"></div>
        </div>
      </PageShell>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <PageShell>
      <div className="flex items-center mb-8">
        <div className="relative h-12 w-12 overflow-hidden">
          <Image
            src={post.authorPhotoURL || '/images/default-avatar.png'}
            alt={post.authorName}
            className="avatar"
            fill
            sizes="48px"
          />
        </div>
        <div className="ml-4">
          <h2 className="flex items-center text-[18px] text-obsidian">
            {post.authorName}
            {authorVerified && <VerificationBadge />}
          </h2>
          <p className="text-[12px] text-felt-gray">
            {formatDistanceToNow(convertTimestampToDate(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <p className="mb-8 text-[18px] leading-[1.21] text-inkstone">{post.content}</p>

      {post.imageURL && !post.videoURL && (
        <div className="relative mb-8 h-96 overflow-hidden bg-ash-mist">
          <Image
            src={post.imageURL}
            alt="Post attachment"
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}
      {post.videoURL && (
        <div className="relative mb-8 w-full">
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

      <div className="hairline-top mt-10 pt-8">
        <h3 className="mb-6 text-[16px] text-obsidian">Comments</h3>
        <div className="space-y-6">
          {post.comments?.map((comment) => (
            <div key={comment.id} className="flex space-x-4">
              <div className="relative h-10 w-10 overflow-hidden">
                <Image
                  src={comment.authorPhotoURL || '/images/default-avatar.png'}
                  alt={comment.authorName}
                  className="avatar"
                  fill
                  sizes="40px"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[14px] text-obsidian">{comment.authorName}</p>
                  {commentVerifications[comment.authorId] && <VerificationBadge />}
                </div>
                <p className="text-[16px] text-inkstone">{comment.content}</p>
                <p className="mt-1 text-[11px] text-felt-gray">
                  {formatDistanceToNow(convertTimestampToDate(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {(!post.comments || post.comments.length === 0) && (
            <p className="text-felt-gray">No comments yet. Be the first to comment.</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}