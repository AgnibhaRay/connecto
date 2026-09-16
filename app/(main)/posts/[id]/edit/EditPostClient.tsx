'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageShell from '@/components/shared/PageShell';
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
      <PageShell title="Edit post">
        <p className="px-4 py-8 text-center text-[13px] text-graphite">Please sign in to edit posts</p>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell title="Edit post">
        <p className="px-4 py-8 text-center text-[13px] text-graphite">Loading post...</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Edit post">
      <form onSubmit={handleSubmit} className="space-y-5 px-4 py-4">
        <div>
          <label htmlFor="content" className="field-label">
            Content
          </label>
          <textarea
            id="content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="textarea-field"
            placeholder="What's on your mind?"
            required
          />
        </div>

        {currentImageURL && (
          <div className="relative w-full">
            <label className="field-label">Current Image</label>
            <div className="relative mt-2 h-64 w-full overflow-hidden">
              <Image
                src={currentImageURL}
                alt="Current post image"
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
            <button
              type="button"
              onClick={() => setCurrentImageURL(null)}
              className="nav-link mt-2 text-felt-gray"
            >
              Remove image
            </button>
          </div>
        )}

        {currentVideoURL && (
          <div className="relative w-full">
            <label className="field-label">Current Video</label>
            <video
              src={currentVideoURL}
              controls
              className="mt-2 h-64 w-full object-contain bg-obsidian"
            />
            <button
              type="button"
              onClick={() => setCurrentVideoURL(null)}
              className="nav-link mt-2 text-felt-gray"
            >
              Remove video
            </button>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !content.trim()}
            className="btn-login"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </PageShell>
  );
}