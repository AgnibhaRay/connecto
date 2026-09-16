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
    <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2 pt-3">
      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden">
        <Image
          src={user.photoURL || '/images/default-avatar.png'}
          alt={user.displayName || ''}
          className="avatar"
          fill
          sizes="32px"
        />
      </div>
      <div className="flex flex-1 items-center">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isSuspended ? 'Your account is suspended' : 'Add a comment...'}
          className="input-field py-2 text-[14px]"
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
        className="nav-link px-2 text-obsidian disabled:opacity-40"
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