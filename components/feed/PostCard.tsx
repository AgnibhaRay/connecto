'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import PostActions from './PostActions';
import { Post, UserProfile } from '@/types';
import { doc, getDoc } from 'firebase/firestore';

interface PostCardProps {
  post: Post;
}

type TimestampType = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
} | Date | string | null | undefined;

export default function PostCard({ post }: PostCardProps) {
  const [user] = useAuthState(auth);
  const [authorUsername, setAuthorUsername] = useState<string>('');

  useEffect(() => {
    const fetchAuthorUsername = async () => {
      try {
        const authorRef = doc(db, 'users', post.authorId);
        const authorDoc = await getDoc(authorRef);
        if (authorDoc.exists()) {
          const authorData = authorDoc.data() as UserProfile;
          setAuthorUsername(authorData.username);
        }
      } catch (error) {
        console.error('Error fetching author data:', error);
      }
    };

    fetchAuthorUsername();
  }, [post.authorId]);

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

  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden w-full max-w-2xl mx-auto">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <Link href={`/profile?username=${authorUsername}`} 
            className="flex items-center group flex-1 min-w-0 mr-2">
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
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {post.authorName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">@{authorUsername}</p>
            </div>
          </Link>
          
          {user && user.uid === post.authorId && (
            <Link
              href={`/posts/${post.id}/edit`}
              className="text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              Edit
            </Link>
          )}
        </div>

        {/* Content */}
        <Link href={`/posts/${post.id}`} className="block space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-800 leading-relaxed break-words line-clamp-4 sm:line-clamp-none">
            {post.content}
          </p>
          
          {post.imageURL && (
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
        </Link>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 border-t border-gray-100">
          <div className="flex-1 min-w-0">
            <PostActions post={post} />
          </div>
          <time 
            className="text-xs sm:text-sm text-gray-400 flex-shrink-0 ml-2" 
            dateTime={post.createdAt?.toString()}
          >
            {formatTimestamp(post.createdAt)}
          </time>
        </div>
      </div>
    </article>
  );
}