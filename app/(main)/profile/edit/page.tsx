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
        const storageRef = ref(storage, `profile-photos/${user.uid}`);
        const uploadResult = await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(uploadResult.ref);
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Profile Photo
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 w-full sm:w-auto"
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