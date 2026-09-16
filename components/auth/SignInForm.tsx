'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { logActivity } from '@/lib/utils/activityLogger';

export default function SignInForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      await logActivity({
        action: 'login',
        userId: userCredential.user.uid,
        userName: userCredential.user.displayName || userCredential.user.email || 'unknown'
      });
      toast.success('Successfully signed in!');
      router.push('/feed');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error signing in:', error);
        toast.error(error.message);
      } else {
        console.error('Unknown error signing in:', error);
        toast.error('An error occurred while signing in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
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
          className="input-field"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="input-field pr-16"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="nav-link absolute inset-y-0 right-3 text-[12px] font-bold text-graphite"
            tabIndex={-1}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="remember-me" className="flex items-center gap-2 text-[13px] text-graphite">
          <input id="remember-me" name="remember-me" type="checkbox" />
          Remember me
        </label>
        <a href="#" className="nav-link text-felt-gray">
          Forgot password
        </a>
      </div>

      <button type="submit" disabled={loading} className="btn-login btn-lg w-full">
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
