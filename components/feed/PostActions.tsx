import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import {
  ArrowPathRoundedSquareIcon,
  ChatBubbleOvalLeftIcon,
  HeartIcon as HeartOutline,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import type { Post } from '@/types';
import Link from 'next/link';

interface PostActionsProps {
  post: Post;
}

export default function PostActions({ post }: PostActionsProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.uid) : false);
  const [likesCount, setLikesCount] = useState(post.likes.length);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setLikesCount(prev => prev - 1);
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="flex w-full items-center justify-between py-2">
      <div className="flex items-center gap-5">
        <button
          onClick={handleLike}
          className="group flex items-center gap-2 text-ink"
          aria-label="Like"
        >
          {isLiked ? (
            <HeartSolid className="h-6 w-6 text-ink" />
          ) : (
            <HeartOutline className="h-6 w-6 stroke-[1.6] group-hover:text-verified-indigo" />
          )}
          <span className="text-[13px] font-normal text-charcoal">{likesCount}</span>
        </button>

        <Link href={`/posts/${post.id}`} className="group flex items-center gap-2 text-ink" aria-label="Comment">
          <ChatBubbleOvalLeftIcon className="h-6 w-6 stroke-[1.6] group-hover:text-verified-indigo" />
          <span className="text-[13px] font-normal text-charcoal">{post.comments?.length || 0}</span>
        </Link>

        <button type="button" onClick={handleShare} className="group text-ink" aria-label="Repost">
          <ArrowPathRoundedSquareIcon className="h-6 w-6 stroke-[1.6] group-hover:text-verified-indigo" />
        </button>
      </div>

      <button type="button" onClick={handleShare} className="group text-ink" aria-label="Share">
        <PaperAirplaneIcon className="h-6 w-6 stroke-[1.6] group-hover:text-verified-indigo" />
      </button>
    </div>
  );
}
