'use client';

import { useState, useRef, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp, doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import type { UserProfile } from '@/types';
import Image from 'next/image';
import { logActivity } from '@/lib/utils/activityLogger';
import { processImageFile, isHeicFile } from '@/lib/utils/imageUtils';

export default function CreatePost() {
  const [user] = useAuthState(auth);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);

  const MAX_VIDEO_SIZE_MB = 100; // 100MB max video size
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear video if an image is selected
      setSelectedVideo(null);
      setVideoPreview(null);

      // Check if it's a HEIC file and notify the user
      if (isHeicFile(file)) {
        toast.success('Converting HEIC image to JPEG format...');
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate video file type
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        toast.error('Please upload a valid video file (MP4, WebM, or QuickTime)');
        return;
      }

      // Validate video file size
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        toast.error(`Video size must be less than ${MAX_VIDEO_SIZE_MB}MB`);
        return;
      }

      // Clear image if a video is selected
      setSelectedImage(null);
      setImagePreview(null);

      setSelectedVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    
    if (isSuspended) {
      toast.error('Your account is suspended. You cannot create new posts.');
      return;
    }

    setIsUploading(true);
    try {
      let imageURL = '';
      let videoURL = '';
      
      if (selectedImage) {
        try {
          // Process the image (convert HEIC to JPEG if needed)
          const processedImage = await processImageFile(selectedImage);
          
          // Upload the processed image
          const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${processedImage.name}`);
          await uploadBytes(imageRef, processedImage);
          imageURL = await getDownloadURL(imageRef);
        } catch (error) {
          console.error('Image processing error:', error);
          toast.error('There was an issue processing your image, but we\'ll try to upload it anyway.');
          
          // Try to upload the original image as a fallback
          try {
            const imageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${selectedImage.name}`);
            await uploadBytes(imageRef, selectedImage);
            imageURL = await getDownloadURL(imageRef);
          } catch (uploadError) {
            console.error('Fallback upload error:', uploadError);
            toast.error('Unable to upload image. Your post will be created without the image.');
          }
        }
      }

      if (selectedVideo) {
        try {
          // Upload the video
          const videoRef = ref(storage, `posts/${user.uid}/${Date.now()}_${selectedVideo.name}`);
          await uploadBytes(videoRef, selectedVideo);
          videoURL = await getDownloadURL(videoRef);
        } catch (error) {
          console.error('Video upload error:', error);
          toast.error('Failed to upload video. Your post will be created without the video.');
        }
      }

      const postData = {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || '/images/default-avatar.png',
        content,
        ...(imageURL && { imageURL }),
        ...(videoURL && { videoURL }),
        likes: [],
        comments: [],
        createdAt: serverTimestamp()
      };

      const postRef = await addDoc(collection(db, 'posts'), postData);
      
      // Log post creation activity
      await logActivity({
        action: 'post_created',
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        targetId: postRef.id,
        details: `Created new post: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
      });
      
      setContent('');
      setSelectedImage(null);
      setSelectedVideo(null);
      setImagePreview(null);
      setVideoPreview(null);
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
          {videoPreview && (
            <div className="mt-2 relative">
              <video
                src={videoPreview}
                controls
                className="rounded-lg w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedVideo(null);
                  setVideoPreview(null);
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
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <VideoCameraIcon className="h-5 w-5 mr-2" />
            Video
          </button>
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoChange}
            accept="video/*"
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