'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navigation from '@/components/shared/Navigation';
import Image from 'next/image';

export default function EditPostClient({ id }: { id: string }) {
  const [user] = useAuthState(auth);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImageURL, setCurrentImageURL] = useState<string | null>(null);
  const [currentVideoURL, setCurrentVideoURL] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      if (!user) return;

      try {
        const postRef = doc(db, 'posts', id);
        const postSnap = await getDoc(postRef);
        
        if (!postSnap.exists()) {
          toast.error('Post not found');
          router.push('/profile');
          return;
        }

        const postData = postSnap.data();
        if (postData.authorId !== user.uid) {
          toast.error('You can only edit your own posts');
          router.push('/profile');
          return;
        }

        setContent(postData.content);
        setCurrentImageURL(postData.imageURL || null);
        setCurrentVideoURL(postData.videoURL || null);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [user, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        content: content.trim(),
        imageURL: currentImageURL,
        videoURL: currentVideoURL,
        updatedAt: new Date()
      });

      toast.success('Post updated successfully!');
      router.push('/profile');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <p className="text-center text-gray-600">Please sign in to edit posts</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <p className="text-center text-gray-600">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Post</h1>
          
          <form onSubmit={handleSubmit}>          <div className="space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-black p-2"
                placeholder="What's on your mind?"
                required
              />
            </div>
            
            {currentImageURL && (
              <div className="relative w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Image</label>
                <div className="relative w-full h-64">
                  <Image
                    src={currentImageURL}
                    alt="Current post image"
                    className="rounded-lg object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentImageURL(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove image
                </button>
              </div>
            )}
            
            {currentVideoURL && (
              <div className="relative w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Video</label>
                <video
                  src={currentVideoURL}
                  controls
                  className="w-full h-64 rounded-lg object-contain bg-black"
                />
                <button
                  type="button"
                  onClick={() => setCurrentVideoURL(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove video
                </button>
              </div>
            )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !content.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}