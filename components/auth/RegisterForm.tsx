/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { UserProfile } from '@/types';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  username: string;
  graduationYear: string; // Keep as string in form for better input handling
  house: string;
  currentLocation: string;
  occupation: string;
  company: string;
  phoneNumber: string;
  bio: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    username: '',
    graduationYear: '',
    house: '',
    currentLocation: '',
    occupation: '',
    company: '',
    phoneNumber: '',
    bio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '==', formData.username.toLowerCase())
      );
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        throw new Error('Username is already taken');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.displayName,
      });

      const now = new Date();

      const userData: UserProfile = {
        uid: userCredential.user.uid,
        email: formData.email,
        displayName: formData.displayName,
        username: formData.username.toLowerCase(),
        graduationYear: parseInt(formData.graduationYear, 10), // Convert to number
        house: formData.house,
        currentLocation: formData.currentLocation,
        occupation: formData.occupation,
        company: formData.company || '',
        phoneNumber: formData.phoneNumber || '',
        bio: formData.bio || '',
        following: [],
        followers: [],
        createdAt: now, // Create actual Date object
        updatedAt: now, // Add updatedAt field
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      toast.success('Successfully registered!');
      router.push('/feed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <input
          type="text"
          required
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Full Name"
          value={formData.displayName}
          onChange={(e) =>
            setFormData({ ...formData, displayName: e.target.value })
          }
        />

        <input
          type="text"
          required
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
        />

        <input
          type="text"
          required
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Passing Year"
          value={formData.graduationYear}
          onChange={(e) =>
            setFormData({ ...formData, graduationYear: e.target.value })
          }
        />

        <input
          type="text"
          required
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="House (e.g., Jawaharlal/Vidyasagar/Tagore/Sarojini)"
          value={formData.house}
          onChange={(e) => setFormData({ ...formData, house: e.target.value })}
        />

        <input
          type="text"
          required
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Current Location"
          value={formData.currentLocation}
          onChange={(e) =>
            setFormData({ ...formData, currentLocation: e.target.value })
          }
        />

        <input
          type="text"
          required
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Occupation"
          value={formData.occupation}
          onChange={(e) =>
            setFormData({ ...formData, occupation: e.target.value })
          }
        />

        <input
          type="text"
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Company (Optional)"
          value={formData.company}
          onChange={(e) =>
            setFormData({ ...formData, company: e.target.value })
          }
        />

        <input
          type="tel"
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Phone Number (Optional)"
          value={formData.phoneNumber}
          onChange={(e) =>
            setFormData({ ...formData, phoneNumber: e.target.value })
          }
        />

        <textarea
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          placeholder="Bio (Optional)"
          rows={4}
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </form>
  );
}