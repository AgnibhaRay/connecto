'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import PostActions from './PostActions';
import Comments from './Comments';
import CommentInput from './CommentInput';
import { Post, UserProfile } from '@/types';
import { doc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import VerificationBadge from '../shared/VerificationBadge';

interface PostCardProps {
  post: Post;
}

type TimestampType = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
} | Date | string | null | undefined;

export default function PostCard({ post: initialPost }: PostCardProps) {
  const [user] = useAuthState(auth);
  const [authorUsername, setAuthorUsername] = useState<string>('');
  const [post, setPost] = useState(initialPost);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAuthorVerified, setIsAuthorVerified] = useState(false);
  const [isAuthorAdmin, setIsAuthorAdmin] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAuthorUsername = async () => {
      try {
        const authorRef = doc(db, 'users', initialPost.authorId);
        const authorDoc = await getDoc(authorRef);
        if (authorDoc.exists()) {
          const authorData = authorDoc.data() as UserProfile;
          setAuthorUsername(authorData.username);
          setIsAuthorVerified(authorData.isVerified || false);
          setIsAuthorAdmin(authorData.isAdmin || false);
        }
      } catch (error) {
        console.error('Error fetching author data:', error);
      }
    };

    fetchAuthorUsername();
  }, [initialPost.authorId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'posts', initialPost.id), (snapshot) => {
      if (snapshot.exists()) {
        setPost({ id: snapshot.id, ...snapshot.data() } as Post);
      }
    });

    return () => unsubscribe();
  }, [initialPost.id]);

  const formatTimestamp = (timestamp: TimestampType) => {
    if (!timestamp) return 'sometime ago';

    if (typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate) {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }

    if (timestamp instanceof Date) {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    }

    if (typeof timestamp === 'object' && 'seconds' in timestamp && timestamp.seconds !== undefined) {
      return formatDistanceToNow(new Date(timestamp.seconds * 1000), { addSuffix: true });
    }

    if (typeof timestamp === 'string') {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    }

    return 'sometime ago';
  };

  const handleCommentAdded = () => {};

  const handleDelete = async () => {
    if (!user || user.uid !== post.authorId) {
      toast.error('You do not have permission to delete this post');
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', post.id));
      toast.success('Post deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
    setShowDropdown(false);
  };

  const handleDoubleTap = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 100;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);

      if (!post.likes.includes(user.uid)) {
        const postRef = doc(db, 'posts', post.id);
        const updatedLikes = [...post.likes, user.uid];
        await updateDoc(postRef, { likes: updatedLikes });
      }
    }

    setLastTap(now);
  }, [lastTap, post.id, post.likes, user]);

  return (
    <article className="post-card relative w-full">
      <div className="flex items-start gap-3">
        <Link href={`/profile?username=${authorUsername}`} className="relative mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <Image
            src={post.authorPhotoURL || '/images/default-avatar.png'}
            alt={post.authorName}
            className="avatar"
            fill
            sizes="40px"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/profile?username=${authorUsername}`} className="min-w-0">
              <div className="flex min-w-0 items-center gap-1">
                <h3 className="truncate text-[15px] font-semibold text-ink">{post.authorName}</h3>
                {isAuthorVerified && <VerificationBadge />}
                {isAuthorAdmin && <span className="tag-pill">Admin</span>}
                <span className="shrink-0 text-[13px] font-normal text-graphite">· {formatTimestamp(post.createdAt)}</span>
              </div>
              <p className="truncate text-[13px] text-graphite">@{authorUsername}</p>
            </Link>

            {user && user.uid === post.authorId && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 text-ink hover:text-verified-indigo"
                >
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>

                {showDropdown && (
                  <div className="menu-panel absolute right-0 top-full z-10 mt-1 w-32 py-1">
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="block px-4 py-2 text-[13px] font-semibold hover:bg-hover-mist"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="block w-full px-4 py-2 text-left text-[13px] font-semibold hover:bg-hover-mist"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href={`/posts/${post.id}`} className="mt-1 block space-y-3" onClick={handleDoubleTap} onDoubleClick={handleDoubleTap}>
            <p className="line-clamp-4 break-words text-[15px] font-normal leading-[21px] text-ink sm:line-clamp-none">
              {post.content}
            </p>

            {post.imageURL && !post.videoURL && (
              <div className="media-frame relative aspect-video w-full bg-hover-mist">
                <Image
                  src={post.imageURL}
                  alt="Post content"
                  className="object-cover"
                  fill
                  sizes="(max-width: 640px) 100vw, 600px"
                  priority={false}
                  loading="lazy"
                />
              </div>
            )}
            {post.videoURL && (
              <div className="media-frame relative aspect-video w-full bg-ink">
                <video
                  src={post.videoURL}
                  controls
                  className="h-full w-full object-cover"
                  preload="metadata"
                />
              </div>
            )}
          </Link>

          <div className="mt-1">
            <PostActions post={post} />

            {post.comments && post.comments.length > 0 && (
              <div className="mt-1">
                <Comments comments={post.comments} maxDisplay={2} />
              </div>
            )}

            <CommentInput postId={post.id} onCommentAdded={handleCommentAdded} />
          </div>
        </div>
      </div>

      {showHeartAnimation && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <HeartIconSolid className="animate-like h-12 w-12 text-ink" />
        </div>
      )}
    </article>
  );
}
