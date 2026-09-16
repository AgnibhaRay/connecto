'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, db } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import PageShell from '@/components/shared/PageShell';
import type { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { processImageFile, isHeicFile } from '@/lib/utils/imageUtils';

export default function EditProfilePage() {
  const [user] = useAuthState(auth);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Fetch current user data
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          setUsername(userData.username);
          setOriginalUsername(userData.username);
          setBio(userData.bio || '');
        }
      };
      fetchUserData();
    }
  }, [user]);

  const isUsernameAvailable = async (username: string) => {
    // If username hasn't changed, no need to check
    if (username === originalUsername) return true;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      toast.error('Username must be 3-20 characters long and can only contain letters, numbers, and underscores');
      return;
    }

    // Check username availability
    const isAvailable = await isUsernameAvailable(username);
    if (!isAvailable) {
      toast.error('Username is already taken');
      return;
    }

    setLoading(true);
    try {
      let photoURL = user.photoURL;
      
      if (file) {
        try {
          // Process the image (convert HEIC to JPEG if needed)
          const processedImage = await processImageFile(file);
          
          const storageRef = ref(storage, `profile-photos/${user.uid}`);
          const uploadResult = await uploadBytes(storageRef, processedImage);
          photoURL = await getDownloadURL(uploadResult.ref);
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          toast.error('There was an issue processing your profile photo, but we\'ll try to upload it anyway.');
          
          // Try to upload the original image as a fallback
          try {
            const storageRef = ref(storage, `profile-photos/${user.uid}`);
            const uploadResult = await uploadBytes(storageRef, file);
            photoURL = await getDownloadURL(uploadResult.ref);
          } catch (uploadError) {
            console.error('Fallback upload error:', uploadError);
            toast.error('Unable to update profile photo. Profile will be updated with your current photo.');
          }
        }
      }

      // Update auth profile
      await updateProfile(user, {
        photoURL,
      });

      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        username,
        bio,
        photoURL,
        updatedAt: new Date()
      }, { merge: true });

      toast.success('Profile updated successfully!');
      router.push('/profile');
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <PageShell>
        <p className="text-center text-felt-gray">Please sign in to edit your profile</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
          <p className="label-micro text-felt-gray">Account</p>
          <h1 className="section-whisper mb-[46px] mt-4">Edit Profile</h1>
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
            <div>
              <label htmlFor="username" className="field-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                pattern="[a-zA-Z0-9_]{3,20}"
                title="Username must be 3-20 characters long and can only contain letters, numbers, and underscores"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter your username"
              />
              <p className="field-hint">3-20 characters, letters, numbers, and underscores only.</p>
            </div>

            <div>
              <label htmlFor="bio" className="field-label">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="textarea-field"
                placeholder="Tell others a bit about yourself..."
              />
            </div>

            <div>
              <label htmlFor="photo" className="field-label">
                Profile Photo
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && isHeicFile(file)) {
                    toast.success('Converting HEIC image to JPEG format...');
                  }
                  setFile(file);
                }}
                className="mt-1 block w-full text-[12px] text-inkstone"
              />
              <p className="field-hint">Supported formats: JPG, PNG, GIF, HEIC (will be converted to JPEG)</p>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="btn-ghost"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
    </PageShell>
  );
}