/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { UserProfile } from '@/types';
import { logActivity } from '@/lib/utils/activityLogger';

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

      // Create user data
      const userData: UserProfile = {
        uid: userCredential.user.uid,
        email: formData.email,
        displayName: formData.displayName,
        username: formData.username.toLowerCase(),
        graduationYear: parseInt(formData.graduationYear, 10),
        house: formData.house,
        currentLocation: formData.currentLocation,
        occupation: formData.occupation,
        company: formData.company || '',
        phoneNumber: formData.phoneNumber || '',
        bio: formData.bio || '',
        following: [],
        followers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isVerified: false,
        isAdmin: false
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // Log the registration activity
      await logActivity({
        action: 'user_registration',
        userId: userCredential.user.uid,
        userName: formData.displayName || formData.email,
        details: 'New user registration'
      });

      toast.success('Successfully registered!');
      router.push('/feed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = 'input-field';

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="space-y-5">
        {step === 1 && (
          <>
            <div>
              <label htmlFor="email-address" className="field-label">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={fieldClass}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={fieldClass}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="field-label">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className={fieldClass}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="displayName" className="field-label">
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Your full name"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="username" className="field-label">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">@</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="input-field pl-8"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="graduationYear" className="field-label">
                  Graduation Year
                </label>
                <input
                  id="graduationYear"
                  name="graduationYear"
                  type="number"
                  required
                  className="input-field"
                  placeholder="e.g. 2025"
                  value={formData.graduationYear}
                  onChange={(e) =>
                    setFormData({ ...formData, graduationYear: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="house" className="field-label">
                  House
                </label>
                <select
                  id="house"
                  name="house"
                  required
                  className="select-field"
                  value={formData.house}
                  onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                >
                  <option value="">Select House</option>
                  <option value="Adams">Adams</option>
                  <option value="Dunster">Dunster</option>
                  <option value="Eliot">Eliot</option>
                  <option value="Kirkland">Kirkland</option>
                  <option value="Leverett">Leverett</option>
                  <option value="Lowell">Lowell</option>
                  <option value="Mather">Mather</option>
                  <option value="Pforzheimer">Pforzheimer</option>
                  <option value="Quincy">Quincy</option>
                  <option value="Winthrop">Winthrop</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="currentLocation" className="field-label">
                  Current Location
                </label>
                <input
                  id="currentLocation"
                  name="currentLocation"
                  type="text"
                  required
                  className="input-field"
                  placeholder="City, Country"
                  value={formData.currentLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, currentLocation: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="occupation" className="field-label">
                  Occupation
                </label>
                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Your role"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({ ...formData, occupation: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company" className="field-label">
                  Company <span className="text-felt-gray">(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  className="input-field"
                  placeholder="Where you work"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="field-label">
                  Phone Number <span className="text-felt-gray">(optional)</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  className="input-field"
                  placeholder="+1 (555) 555-5555"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="field-label">
                Bio <span className="text-felt-gray">(optional)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                  className="textarea-field"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <p className="field-hint">
                Brief description for your profile. URLs are hyperlinked.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="btn-ghost w-full"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-login w-full"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-obsidian" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {step === 1 ? 'Validating...' : 'Creating account...'}
            </>
          ) : (
            step === 1 ? (
              <>
                Next
                <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              'Create Account'
            )
          )}
        </button>
      </div>
    </form>
  );
}