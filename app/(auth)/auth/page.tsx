'use client';

import { useState } from 'react';
import SignInForm from '@/components/auth/SignInForm';
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';
import { LogoMark } from '@/components/shared/Logo';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-2">
      <section className="relative hidden items-center justify-center bg-card lg:flex">
        <div className="absolute inset-y-0 right-0 w-px bg-concrete" />
        <div className="px-16">
          <LogoMark className="h-20 w-20 text-ink" />
          <h1 className="mt-8 text-[72px] font-bold leading-[0.9] tracking-tight text-ink">
            Connecto
          </h1>
          <p className="mt-6 max-w-sm text-[20px] leading-snug text-charcoal">
            Share work, gather for events, and keep conversations close.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between px-5 lg:hidden">
          <Link href="/" className="flex items-center gap-2 text-[18px] font-bold tracking-tight">
            <LogoMark className="h-7 w-7" />
            Connecto
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px]">
            <LogoMark className="mb-8 hidden h-12 w-12 lg:block" />
            <h2 className="text-[31px] font-bold tracking-tight text-ink">
              {isSignIn ? 'Sign in to Connecto' : 'Create your account'}
            </h2>
            <p className="mt-2 text-[15px] text-graphite">
              {isSignIn
                ? 'Welcome back. Pick up the feed where you left it.'
                : 'Join to post, follow events, and message people you know.'}
            </p>
            <div className="mt-8">
              {isSignIn ? <SignInForm /> : <RegisterForm />}
            </div>
            <p className="mt-8 text-[15px] text-graphite">
              {isSignIn ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsSignIn(!isSignIn)}
                className="font-semibold text-ink underline-offset-2 hover:underline"
              >
                {isSignIn ? 'Register' : 'Sign in'}
              </button>
            </p>
          </div>
        </main>
      </section>
    </div>
  );
}
