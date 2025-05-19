'use client';

import { useState, useRef } from 'react';
import { auth, db, storage } from '@/lib/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { processImageFile } from '@/lib/utils/imageUtils';
import Image from 'next/image';

export default function CreateStory() {
  const [user] = useAuthState(auth);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file');
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${isVideo ? '50MB' : '10MB'}`);
      return;
    }

    setSelectedFile(file);
    
    if (isImage) {
      // Determine image orientation for proper preview styling
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          const img = document.createElement('img');
          img.src = e.target.result as string;
          
          img.onload = () => {
            if (img.width > img.height) {
              setImageOrientation('landscape');
            } else if (img.width < img.height) {
              setImageOrientation('portrait');
            } else {
              setImageOrientation('square');
            }
            setImageDimensions({ width: img.width, height: img.height });
            setPreview(img.src);
          };
        }
      };
      
      reader.readAsDataURL(file);
    } else {
      // For videos, just set the preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    setIsUploading(true);
    try {
      let mediaURL = '';
      const isVideo = selectedFile.type.startsWith('video/');
      
      if (isVideo) {
        // Upload video directly
        const videoRef = ref(storage, `stories/${user.uid}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(videoRef, selectedFile);
        mediaURL = await getDownloadURL(videoRef);
      } else {
        // Process and upload image
        try {
          const processedImage = await processImageFile(selectedFile);
          const imageRef = ref(storage, `stories/${user.uid}/${Date.now()}_${processedImage.name}`);
          await uploadBytes(imageRef, processedImage);
          mediaURL = await getDownloadURL(imageRef);
        } catch (error) {
          console.error('Image processing error:', error);
          toast.error('Failed to process image');
          return;
        }
      }

      // Calculate expiration time (24 hours from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Create story document
      await addDoc(collection(db, 'stories'), {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || '/images/default-avatar.png',
        mediaURL,
        mediaType: isVideo ? 'video' : 'image',
        caption: caption.trim() || null,
        createdAt: now,
        expiresAt,
        viewedBy: [],
        orientation: isVideo ? null : imageOrientation, // Store image orientation for proper display
      });

      toast.success('Story created successfully!');
      setPreview(null);
      setSelectedFile(null);
      setCaption('');
      setImageDimensions(null);
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative group">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-indigo-500 transition-colors"
      >
        <PlusIcon className="h-6 w-6 text-gray-500 group-hover:text-indigo-500" />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-4">
            <div className="space-y-4">
              {selectedFile?.type.startsWith('video/') ? (
                <video src={preview} controls className="w-full rounded-lg" />
              ) : (
                <div className="flex justify-center">
                  <div className={`relative overflow-hidden rounded-lg ${
                    imageOrientation === 'portrait' 
                      ? 'max-h-[70vh] w-auto' 
                      : imageOrientation === 'landscape' 
                        ? 'max-w-full h-auto' 
                        : 'w-full max-w-[70vh] max-h-[70vh]'
                  }`}>
                    {imageDimensions && (
                      <div style={{ 
                        position: 'relative', 
                        width: imageOrientation === 'portrait' ? 'auto' : '100%',
                        height: imageOrientation === 'portrait' ? '70vh' : 'auto',
                        minWidth: '300px',
                        margin: '0 auto'
                      }}>
                        <Image 
                          src={preview} 
                          alt="Story preview" 
                          className="object-contain"
                          fill={true}
                          sizes="(max-width: 768px) 100vw, 500px"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                    setCaption('');
                    setImageDimensions(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {isUploading ? 'Creating...' : 'Share Story'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
