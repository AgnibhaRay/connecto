'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDoc, Timestamp } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import PageShell from '@/components/shared/PageShell';
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
      <PageShell title="Messages">
        <p className="px-4 py-8 text-center text-[13px] text-graphite">Please sign in to view your messages</p>
      </PageShell>
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
    <PageShell title="Messages">
      {loading ? (
        <p className="px-4 py-8 text-[13px] text-graphite">Loading conversations...</p>
      ) : chats.length === 0 ? (
        <div className="px-4 py-8 text-[15px] text-graphite">
          <p>No messages yet</p>
          <p className="mt-2 text-[13px]">
            Start a conversation by visiting someone&apos;s profile
          </p>
        </div>
      ) : (
        <div>
          {chats.map((chat) => {
            const otherParticipantId = chat.participants.find(id => id !== user.uid);
            const otherParticipant = otherParticipantId ? participants[otherParticipantId] : null;

            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block border-b border-concrete px-4 py-3 hover:bg-hover-mist"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 overflow-hidden">
                    <Image
                      className="avatar h-10 w-10"
                      src={otherParticipant?.photoURL || defaultAvatar}
                      alt={otherParticipant?.displayName || 'User'}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">
                      {otherParticipant?.displayName || 'Loading...'}
                    </p>
                    <p className="truncate text-[15px] text-charcoal">
                      {chat.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                  {chat.lastMessage?.timestamp && (
                    <div className="text-[12px] font-bold text-graphite">
                      {formatDate(chat.lastMessage.timestamp)}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}