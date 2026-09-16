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
    <div className="space-y-3">
      {visibleComments.map((comment) => (
        <div key={comment.id} className="flex space-x-2">
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
            <Image
              src={comment.authorPhotoURL || '/images/default-avatar.png'}
              alt={comment.authorName}
              className="avatar"
              fill
              sizes="32px"
            />
          </div>
          <div className="flex-grow">
            <div className="mb-0.5 flex items-center gap-1">
              <span className="text-[13px] font-semibold text-ink">{comment.authorName}</span>
              {comment.isVerified && <VerificationBadge />}
              <span className="text-[13px] font-normal text-graphite">
                · {formatDistanceToNow(comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-[15px] leading-[1.4] text-ink">{comment.content}</p>
          </div>
        </div>
      ))}

      {comments.length > (maxDisplay || 0) && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-[13px] font-semibold text-verified-indigo"
        >
          View all {comments.length} comments
        </button>
      )}
    </div>
  );
}