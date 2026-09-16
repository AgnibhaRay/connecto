'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import PageShell from '@/components/shared/PageShell';
import Image from 'next/image';
import defaultAvatar from '@/public/images/default-avatar.png';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export default function ChatRoomPage() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || !id) return;

    const fetchChatData = async () => {
      try {
        const chatRef = doc(db, 'chats', id as string);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
          toast.error('Chat not found');
          return;
        }

        const chatData = chatDoc.data();
        const otherParticipantId = chatData.participants.find((pid: string) => pid !== user.uid);

        if (otherParticipantId) {
          const userRef = doc(db, 'users', otherParticipantId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setOtherUser({
              uid: otherParticipantId,
              ...userDoc.data() as Omit<UserProfile, 'uid'>
            });
          }
        }
      } catch (error) {
        console.error('Error fetching chat:', error);
        toast.error('Error loading chat');
      }
    };

    // Subscribe to messages
    const messagesRef = collection(db, 'chats', id as string, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(messageList);
      setLoading(false);
      scrollToBottom();
    });

    fetchChatData();
    return () => unsubscribe();
  }, [user, id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    try {
      const chatRef = doc(db, 'chats', id as string);
      const messagesRef = collection(chatRef, 'messages');

      // Add message
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        timestamp: serverTimestamp()
      });

      // Update chat's last message and timestamp
      await updateDoc(chatRef, {
        lastMessage: {
          text: newMessage,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (!user) {
    return (
      <PageShell title="Messages">
        <p className="px-4 py-8 text-center text-[13px] text-graphite">Please sign in to view messages</p>
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
    <PageShell title={otherUser?.displayName || 'Messages'}>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="flex items-center space-x-3 border-b border-concrete px-4 py-3">
          <div className="flex-shrink-0 overflow-hidden">
            <Image
              className="avatar h-10 w-10"
              src={otherUser?.photoURL || defaultAvatar}
              alt={otherUser?.displayName || 'User'}
              width={40}
              height={40}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-ink">
              {otherUser?.displayName || 'Loading...'}
            </h2>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="text-[13px] text-graphite">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-[13px] text-graphite">No messages yet</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-[18px] px-3 py-2 ${
                    message.senderId === user.uid
                      ? 'bg-ink text-card'
                      : 'border border-concrete bg-hover-mist text-ink'
                  }`}
                >
                  <p className="text-[15px]">{message.text}</p>
                  <p className={`mt-1 text-[12px] font-bold ${
                    message.senderId === user.uid ? 'text-concrete' : 'text-graphite'
                  }`}>
                    {formatDate(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-concrete px-4 py-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-login"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}