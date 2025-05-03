'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Navigation from '@/components/shared/Navigation';

export default function EditPostPage({ params }: { params: { id: string } }) {
  const [user] = useAuthState(auth);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      if (!user) return;

      try {
        const postRef = doc(db, 'posts', params.id);
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
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [user, params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);
    try {
      const postRef = doc(db, 'posts', params.id);
      await updateDoc(postRef, {
        content: content.trim(),
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
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
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