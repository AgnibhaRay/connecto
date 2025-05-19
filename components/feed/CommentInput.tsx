import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, Timestamp, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { Comment, UserProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CommentInputProps {
  postId: string;
  onCommentAdded?: () => void;
}

export default function CommentInput({ postId, onCommentAdded }: CommentInputProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user document to check suspension status
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot: DocumentSnapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile;
        setIsSuspended(userData.isSuspended || false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim() || isSubmitting) return;

    if (isSuspended) {
      toast.error('Your account is suspended. You cannot add comments.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = Timestamp.now();
      const newComment: Comment = {
        id: uuidv4(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || '/images/default-avatar.png',
        content: comment.trim(),
        createdAt: now.toDate()
      };

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          ...newComment,
          createdAt: now
        })
      });

      setComment('');
      onCommentAdded?.();
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-3 border-t">
      <div className="h-8 w-8 relative flex-shrink-0">
        <Image
          src={user.photoURL || '/images/default-avatar.png'}
          alt={user.displayName || ''}
          className="rounded-full"
          fill
          sizes="32px"
        />
      </div>
      <div className="flex-1 flex items-center">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isSuspended ? 'Your account is suspended' : 'Add a comment...'}
          className="w-full bg-blue-50 rounded-full px-4 py-2 text-sm text-black placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
          aria-label="Comment input"
          maxLength={1000}
          disabled={isSuspended}
          enterKeyHint="send"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (comment.trim()) {
                handleSubmit(e);
              }
            }
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!comment.trim() || isSubmitting || isSuspended}
        className="text-blue-500 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 hover:bg-blue-100 rounded-full active:bg-blue-200 transition-colors"
        aria-label={
          isSuspended ? "Account suspended" : 
          isSubmitting ? "Posting comment..." : 
          "Post comment"
        }
      >
        {isSubmitting ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}