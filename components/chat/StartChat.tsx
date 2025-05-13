'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface StartChatProps {
  targetUserId: string;
  className?: string;
}

export default function StartChat({ targetUserId, className = '' }: StartChatProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartChat = async () => {
    if (!auth.currentUser) {
      toast.error('Please sign in to start a chat');
      return;
    }

    if (auth.currentUser.uid === targetUserId) {
      toast.error('You cannot chat with yourself');
      return;
    }

    setIsLoading(true);
    try {
      // Check if a chat already exists between these users
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let existingChatId: string | null = null;
      
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        if (chatData.participants.includes(targetUserId)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        router.push(`/chat/${existingChatId}`);
      } else {
        // Create new chat
        const newChat = await addDoc(chatsRef, {
          participants: [auth.currentUser.uid, targetUserId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        router.push(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {isLoading ? 'Starting chat...' : 'Message'}
    </button>
  );
}