import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { HandThumbUpIcon as LikeOutline } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as LikeSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import type { Post } from '@/types';

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

  return (
    <button
      onClick={handleLike}
      className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
    >
      {isLiked ? (
        <LikeSolid className="h-5 w-5 text-blue-500" />
      ) : (
        <LikeOutline className="h-5 w-5" />
      )}
      <span>{likesCount}</span>
    </button>
  );
}