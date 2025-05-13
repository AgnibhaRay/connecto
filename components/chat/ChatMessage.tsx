'use client';

import { Message } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import Image from 'next/image';
import { useEffect } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ChatMessageProps {
  message: Message;
  senderPhotoURL?: string;
}

export default function ChatMessage({ message, senderPhotoURL }: ChatMessageProps) {
  const [user] = useAuthState(auth);
  const isOwnMessage = user?.uid === message.senderId;

  useEffect(() => {
    const markAsRead = async () => {
      if (!isOwnMessage && user && !message.readBy.includes(user.uid)) {
        const messageRef = doc(db, 'messages', message.id);
        await updateDoc(messageRef, {
          readBy: arrayUnion(user.uid)
        });
      }
    };

    markAsRead();
  }, [message.id, isOwnMessage, user, message.readBy]);

  return (
    <div className={`flex items-end space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className="flex-shrink-0 relative h-8 w-8">
        <Image
          src={senderPhotoURL || '/images/default-avatar.png'}
          alt="User avatar"
          className="rounded-full"
          fill
          sizes="32px"
        />
      </div>
      <div className="flex flex-col">
        <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center mt-1 space-x-1 text-xs ${isOwnMessage ? 'justify-end' : ''}`}>
          <span className="text-gray-500">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {isOwnMessage && (
            <div className="flex items-center">
              {message.readBy.length > 0 ? (
                <div className="flex items-center text-blue-500">
                  <CheckIcon className="h-3 w-3" />
                  <CheckIcon className="h-3 w-3 -ml-1" />
                  <span className="ml-1 text-xs text-gray-500">Read</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-400">
                  <CheckIcon className="h-3 w-3" />
                  <CheckIcon className="h-3 w-3 -ml-1" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}