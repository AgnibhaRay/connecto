import { FieldValue, Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  username: string; // unique identifier
  displayName: string;
  graduationYear: number;
  house: string;
  currentLocation: string;
  occupation: string;
  company?: string;
  phoneNumber?: string;
  bio?: string;
  photoURL?: string;
  following: string[];
  followers: string[];
  createdAt: Date | FieldValue | Timestamp;
  updatedAt: Date | FieldValue | Timestamp;
  isVerified?: boolean;
  isAdmin?: boolean;
  isSuspended?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  imageURL?: string;
  videoURL?: string;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  coverImage?: string;
  organizer: {
    id: string;
    name: string;
    photoURL?: string;
  };
  attendees: {
    id: string;
    name: string;
    photoURL?: string;
    status: 'going' | 'interested' | 'not_going';
  }[];
  category: 'social' | 'academic' | 'professional' | 'other';
  isOnline: boolean;
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  participants: string[]; // Array of user IDs
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readBy: string[]; // Array of user IDs who have read the message
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  mediaURL: string;
  storagePath: string;
  mediaType: 'image' | 'video';
  caption?: string;
  createdAt: Date | { seconds: number; nanoseconds: number };
  expiresAt: Date | { seconds: number; nanoseconds: number };
  viewedBy: string[];
  orientation?: 'portrait' | 'landscape' | 'square' | null;
}