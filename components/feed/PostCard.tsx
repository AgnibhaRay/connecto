'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import PostActions from './PostActions';
import Comments from './Comments';
import CommentInput from './CommentInput';
import { Post, UserProfile } from '@/types';
import { doc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
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
    // Listen for real-time updates to the post
    const unsubscribe = onSnapshot(doc(db, 'posts', initialPost.id), (doc) => {
      if (doc.exists()) {
        setPost({ id: doc.id, ...doc.data() } as Post);
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

  const handleCommentAdded = () => {
    // Refresh post data if needed
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
    setShowDropdown(false);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden w-full max-w-2xl mx-auto">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header with dropdown */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Link href={`/profile?username=${authorUsername}`} 
            className="flex items-center group flex-1 min-w-0">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 mr-2 sm:mr-3">
              <Image
                src={post.authorPhotoURL || '/images/default-avatar.png'}
                alt={post.authorName}
                className="rounded-full object-cover transition-transform group-hover:scale-105"
                fill
                sizes="(max-width: 640px) 32px, 40px"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate flex items-center gap-2">
                {post.authorName}
                {isAuthorVerified && <VerificationBadge />}
                {isAuthorAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Admin
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">@{authorUsername}</p>
            </div>
          </Link>
          
          {user && user.uid === post.authorId && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <Link href={`/posts/${post.id}`} className="block space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-800 leading-relaxed break-words line-clamp-4 sm:line-clamp-none">
            {post.content}
          </p>
          
          {post.imageURL && !post.videoURL && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={post.imageURL}
                alt="Post content"
                className="object-cover transform hover:scale-105 transition-transform duration-500"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
                priority={false}
                loading="lazy"
              />
            </div>
          )}
          {post.videoURL && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-50">
              <video
                src={post.videoURL}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              />
            </div>
          )}
        </Link>

        {/* Footer */}
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex-1 min-w-0">
              <PostActions post={post} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {post.comments?.length || 0} comments
              </span>
              <time 
                className="text-xs sm:text-sm text-gray-400 flex-shrink-0" 
                dateTime={post.createdAt?.toString()}
              >
                • {formatTimestamp(post.createdAt)}
              </time>
            </div>
          </div>

          {/* Comments section */}
          {post.comments && post.comments.length > 0 && (
            <div className="mt-2">
              <Comments comments={post.comments} maxDisplay={2} />
            </div>
          )}

          {/* Comment input */}
          <CommentInput postId={post.id} onCommentAdded={handleCommentAdded} />
        </div>
      </div>
    </article>
  );
}