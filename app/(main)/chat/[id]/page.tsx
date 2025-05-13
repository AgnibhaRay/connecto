'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import Navigation from '@/components/shared/Navigation';
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
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-center text-gray-600">Please sign in to view messages</p>
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Image
                className="h-10 w-10 rounded-full"
                src={otherUser?.photoURL || defaultAvatar}
                alt={otherUser?.displayName || 'User'}
                width={40}
                height={40}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-medium text-gray-900">
                {otherUser?.displayName || 'Loading...'}
              </h2>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center text-gray-600">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-600">No messages yet</div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.senderId === user.uid
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === user.uid ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {formatDate(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-md sm:text-sm border-gray-300"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}