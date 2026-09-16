'use client';

import { useState } from 'react';
import SignInForm from '@/components/auth/SignInForm';
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex h-14 items-center justify-between border-b border-concrete bg-card px-4">
        <Link href="/" className="text-[15px] font-semibold text-ink">
          Connecto
        </Link>
        <button
          type="button"
          onClick={() => setIsSignIn((prev) => !prev)}
          className="btn-login"
        >
          {isSignIn ? 'Register' : 'Log in'}
        </button>
      </header>

      <main className="mx-auto w-full max-w-[600px] px-4 py-8">
        <div className="rounded-[18px] border border-concrete bg-card p-4">
          <h1 className="text-[15px] font-semibold text-ink">
            {isSignIn ? 'Log in' : 'Create account'}
          </h1>
          <p className="mt-1 text-[13px] text-graphite">
            {isSignIn
              ? 'Welcome back. Sign in to keep reading the feed.'
              : 'Join the community to share posts, events, and messages.'}
          </p>
          <div className="mt-6">
            {isSignIn ? <SignInForm /> : <RegisterForm />}
          </div>
          <p className="mt-6 text-[13px] text-graphite">
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsSignIn(!isSignIn)}
              className="font-semibold text-verified-indigo"
            >
              {isSignIn ? 'Register now' : 'Log in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
