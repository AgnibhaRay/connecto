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
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4 hairline-top bg-paper">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="input-field flex-1"
        maxLength={1000}
        disabled={isSending}
      />
      <button
        type="submit"
        disabled={!message.trim() || isSending}
        className="btn-ghost disabled:opacity-40"
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}