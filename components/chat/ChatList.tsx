'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Chat, UserProfile, Message } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import defaultAvatar from '@/public/images/default-avatar.png';

interface ChatWithId extends Omit<Chat, 'lastMessage'> {
  id: string;
  lastMessage?: Message;
}

export default function ChatList() {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<ChatWithId[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's chats
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatData: ChatWithId[] = [];
      const userPromises: Promise<void>[] = [];
      const newUsers: Record<string, UserProfile> = {};

      snapshot.forEach((doc) => {
        const chat = { id: doc.id, ...doc.data() } as ChatWithId;
        chatData.push(chat);
        
        // Get other participant's data
        const otherUserId = chat.participants.find(id => id !== user.uid);
        if (otherUserId && !users[otherUserId]) {
          const userPromise = fetch(`/api/users/${otherUserId}`)
            .then(res => res.json())
            .then(userData => {
              newUsers[otherUserId] = userData;
            })
            .catch(error => {
              console.error('Error fetching user data:', error);
            });
          userPromises.push(userPromise);
        }
      });

      await Promise.all(userPromises);
      setUsers(prev => ({ ...prev, ...newUsers }));
      // Sort chats by updatedAt before setting state
      chatData.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      });
      setChats(chatData);
    });

    return () => unsubscribe();
  }, [user, users]);

  if (!user) return null;

  const formatMessageDate = (date: Date) => {
    if (!date) return '';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="divide-y divide-gray-200">
      {chats.map(chat => {
        const otherUserId = chat.participants.find(id => id !== user.uid);
        const otherUser = otherUserId ? users[otherUserId] : null;

        return (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className="block hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <Image
                    src={otherUser?.photoURL || defaultAvatar}
                    alt={otherUser?.displayName || 'User'}
                    className="rounded-full"
                    width={40}
                    height={40}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {otherUser?.displayName || 'Loading...'}
                    </p>
                    {chat.lastMessage && !chat.lastMessage.readBy.includes(user.uid) && chat.lastMessage.senderId !== user.uid && (
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className={`text-sm truncate ${!chat.lastMessage.readBy.includes(user.uid) && chat.lastMessage.senderId !== user.uid ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
                {chat.lastMessage?.createdAt && (
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-xs text-gray-500">
                      {formatMessageDate(chat.lastMessage.createdAt)}
                    </span>
                    {chat.lastMessage.senderId === user.uid && chat.lastMessage.readBy.length > 1 && (
                      <span className="text-blue-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
      {chats.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-gray-500">No conversations yet</p>
        </div>
      )}
    </div>
  );
}