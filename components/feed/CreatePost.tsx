'use client';

import { useState, useRef } from 'react';
import { auth, db, storage } from '@/lib/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Post } from '@/types';
import Image from 'next/image';

export default function CreatePost() {
  const [user] = useAuthState(auth);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsUploading(true);
    try {
      let imageURL = '';
      
      if (selectedImage) {
        const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        imageURL = await getDownloadURL(imageRef);
      }

      const postData = {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || '/images/default-avatar.png',
        content,
        ...(imageURL && { imageURL }),
        likes: [],
        comments: [],
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'posts'), postData);
      
      setContent('');
      setSelectedImage(null);
      setImagePreview(null);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex space-x-4">
        <div className="h-10 w-10 relative">
          <Image
            src={user.photoURL || '/images/default-avatar.png'}
            alt={user.displayName || ''}
            className="rounded-full"
            fill
            sizes="40px"
          />
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            rows={3}
          />
          {imagePreview && (
            <div className="mt-2 relative">
              <div className="relative w-full h-48">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PhotoIcon className="h-5 w-5 mr-2" />
            Photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <button
          type="submit"
          disabled={!content.trim() || isUploading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isUploading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}