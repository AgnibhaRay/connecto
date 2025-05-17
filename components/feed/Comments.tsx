import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Comment, UserProfile } from '@/types';
import VerificationBadge from '../shared/VerificationBadge';

interface CommentsProps {
  comments: Comment[];
  maxDisplay?: number;
}

interface CommentWithVerification extends Comment {
  isVerified?: boolean;
}

export default function Comments({ comments, maxDisplay }: CommentsProps) {
  const [displayComments, setDisplayComments] = useState<CommentWithVerification[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      const commentsWithVerification = await Promise.all(
        comments.map(async (comment) => {
          const userRef = doc(db, 'users', comment.authorId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.exists() ? userDoc.data() as UserProfile : null;
          return {
            ...comment,
            isVerified: userData?.isVerified || false
          };
        })
      );
      setDisplayComments(commentsWithVerification);
    };

    fetchVerificationStatus();
  }, [comments]);

  const visibleComments = showAll ? displayComments : displayComments.slice(0, maxDisplay || displayComments.length);

  return (
    <div className="space-y-4">
      {visibleComments.map((comment) => (
        <div key={comment.id} className="flex space-x-3">
          <div className="flex-shrink-0 w-8 h-8 relative">
            <Image
              src={comment.authorPhotoURL || '/images/default-avatar.png'}
              alt={comment.authorName}
              className="rounded-full"
              fill
              sizes="32px"
            />
          </div>
          <div className="flex-grow">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <span className="font-medium text-gray-900">{comment.authorName}</span>
                {comment.isVerified && <VerificationBadge />}
              </div>
              <p className="text-gray-700 text-sm">{comment.content}</p>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
      
      {comments.length > (maxDisplay || 0) && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View all {comments.length} comments
        </button>
      )}
    </div>
  );
}