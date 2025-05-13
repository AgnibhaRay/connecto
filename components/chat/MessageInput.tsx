'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface MessageInputProps {
  chatId: string;
  senderId: string;
}

export default function MessageInput({ chatId, senderId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const messageId = uuidv4();
      const newMessage = {
        id: messageId,
        chatId,
        senderId,
        content: message.trim(),
        read: false,
        createdAt: serverTimestamp()
      };

      // Add message to messages collection
      await addDoc(collection(db, 'messages'), newMessage);

      // Update chat's last message
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        updatedAt: serverTimestamp()
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4 border-t bg-white">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        maxLength={1000}
        disabled={isSending}
      />
      <button
        type="submit"
        disabled={!message.trim() || isSending}
        className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}