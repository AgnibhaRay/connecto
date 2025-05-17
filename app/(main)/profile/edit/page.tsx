'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, db } from '@/lib/firebase/config';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import Navigation from '@/components/shared/Navigation';
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
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-center text-gray-600">Please sign in to edit your profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-200">Edit Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-2">
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 text-gray-800 placeholder-gray-500"
                placeholder="Enter your username"
              />
              <p className="mt-1 text-xs text-gray-500">3-20 characters, letters, numbers, and underscores only.</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <label htmlFor="bio" className="block text-sm font-semibold text-gray-800 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 text-gray-800 placeholder-gray-500"
                placeholder="Tell others a bit about yourself..."
              />
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <label htmlFor="photo" className="block text-sm font-semibold text-gray-800 mb-2">
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
                className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 py-2 px-3"
              />
              <p className="mt-1 text-xs text-gray-500">Supported formats: JPG, PNG, GIF, HEIC (will be converted to JPEG)</p>
            </div>

            <div className="flex justify-center mt-8">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 w-full sm:w-auto shadow-sm transition-all duration-200 hover:shadow-md"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}