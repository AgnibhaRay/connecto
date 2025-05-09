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
  createdAt: Date;
  updatedAt: Date;
  isVerified?: boolean;
  isAdmin?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  imageURL?: string;
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