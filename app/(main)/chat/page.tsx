'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDoc, Timestamp } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import Navigation from '@/components/shared/Navigation';
import Link from 'next/link';
import Image from 'next/image';
import defaultAvatar from '@/public/images/default-avatar.png';

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
  };
  updatedAt: Timestamp;
}

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export default function ChatPage() {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [participants, setParticipants] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsList: Chat[] = [];
      const participantsMap: Record<string, UserProfile> = {};
      
      for (const docSnapshot of snapshot.docs) {
        const chat = { id: docSnapshot.id, ...docSnapshot.data() } as Chat;
        chatsList.push(chat);

        const otherParticipantId = chat.participants.find(id => id !== user.uid);
        if (otherParticipantId && !participants[otherParticipantId]) {
          try {
            const userDocRef = doc(db, 'users', otherParticipantId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as UserProfile;
              participantsMap[otherParticipantId] = {
                ...userData,
                uid: otherParticipantId
              };
            }
          } catch (error) {
            console.error('Error fetching participant info:', error);
          }
        }
      }

      setChats(chatsList);
      setParticipants(prev => ({ ...prev, ...participantsMap }));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, participants]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-center text-gray-600">Please sign in to view your messages</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-600">
              Loading conversations...
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-600">
              <p>No messages yet</p>
              <p className="text-sm mt-2">
                Start a conversation by visiting someone&apos;s profile
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chats.map((chat) => {
                const otherParticipantId = chat.participants.find(id => id !== user.uid);
                const otherParticipant = otherParticipantId ? participants[otherParticipantId] : null;

                return (
                  <Link
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    className="block hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="p-4 sm:px-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Image
                            className="h-12 w-12 rounded-full"
                            src={otherParticipant?.photoURL || defaultAvatar}
                            alt={otherParticipant?.displayName || 'User'}
                            width={48}
                            height={48}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {otherParticipant?.displayName || 'Loading...'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage?.text || 'No messages yet'}
                          </p>
                        </div>
                        {chat.lastMessage?.timestamp && (
                          <div className="text-xs text-gray-500">
                            {formatDate(chat.lastMessage.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}