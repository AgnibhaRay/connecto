import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { HandThumbUpIcon as LikeOutline } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as LikeSolid } from '@heroicons/react/24/solid';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Post } from '@/types';

interface PostActionsProps {
  post: Post;
}

export default function PostActions({ post }: PostActionsProps) {
  const { user } = useAuth();
  const router = useRouter();
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
  };

  const handleEdit = () => {
    if (!user || user.uid !== post.authorId) {
      toast.error('You do not have permission to edit this post');
      return;
    }
    router.push(`/posts/${post.id}/edit`);
  };

  return (
    <div className="flex items-center space-x-4">
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

      {user && user.uid === post.authorId && (
        <>
          <button
            onClick={handleEdit}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
          >
            <PencilSquareIcon className="h-5 w-5" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
          >
            <TrashIcon className="h-5 w-5" />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
}