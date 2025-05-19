'use client';

import { useState, useRef, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { processImageFile } from '@/lib/utils/imageUtils';
import Image from 'next/image';
import { logActivity } from '@/lib/utils/activityLogger';
import type { UserProfile } from '@/types';

export default function CreateStory() {
  const [user] = useAuthState(auth);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user document to check suspension status
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot: DocumentSnapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile;
        setIsSuspended(userData.isSuspended || false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      toast.error('Videos are not supported for stories');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    if (isSuspended) {
      toast.error('Your account is suspended. You cannot create stories.');
      return;
    }

    setIsUploading(true);
    try {
      // Process the image
      const processedImage = await processImageFile(selectedFile);
      
      // Upload image to storage
      const imageRef = ref(storage, `stories/${user.uid}/${Date.now()}_${processedImage.name}`);
      await uploadBytes(imageRef, processedImage);
      const imageURL = await getDownloadURL(imageRef);

      // Create story document
      const storyData = {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || '/images/default-avatar.png',
        imageURL,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      };

      await addDoc(collection(db, 'stories'), storyData);

      // Log the activity
      await logActivity({
        action: 'story_created',
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        details: 'Created a new story'
      });

      // Reset form
      setSelectedFile(null);
      setImagePreview(null);
      
      toast.success('Story created successfully!');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {!selectedFile ? (
        <button
          type="button"
          onClick={() => !isSuspended && fileInputRef.current?.click()}
          disabled={isSuspended}
          className="relative h-40 w-28 rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isSuspended ? 'Your account is suspended' : 'Create a story'}
        >
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
            <PlusIcon className="h-6 w-6 text-gray-500" />
          </div>
          <span className="text-xs text-gray-500">Create Story</span>
        </button>
      ) : (
        <div className="relative h-40 w-28">
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <Image
              src={imagePreview || ''}
              alt="Story preview"
              className="object-cover"
              fill
              sizes="112px"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setImagePreview(null);
            }}
            className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
          >
            ×
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Posting...' : 'Post Story'}
          </button>
        </div>
      )}
    </form>
  );
}
