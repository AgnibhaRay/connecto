'use client';

import { useState } from 'react';
import SignInForm from '@/components/auth/SignInForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ScrollIndicator from '@/components/shared/ScrollIndicator';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="bg-paper">
      <section className="hero-iridescent relative flex min-h-screen items-center justify-center">
        <header className="absolute inset-x-0 top-0 z-20 h-[66px]">
          <div className="page-container flex h-full items-center justify-between text-paper">
            <span className="text-[16px] font-normal">connecto</span>
            <button
              type="button"
              onClick={() => setIsSignIn((prev) => !prev)}
              className="nav-link text-[11px] uppercase tracking-[0.18em] text-paper"
            >
              {isSignIn ? 'Register' : 'Sign in'}
            </button>
          </div>
        </header>

        <h1 className="display-headline relative z-10 px-4 text-center">
          Connecto
        </h1>

        <div className="absolute bottom-8 left-6 z-10 md:left-10">
          <ScrollIndicator light />
        </div>
      </section>

      <section className="page-container py-[68px] md:py-[152px]">
        <div className="grid gap-[46px] md:grid-cols-[1fr_minmax(280px,420px)] md:items-start">
          <div>
            <p className="label-micro text-felt-gray">
              {isSignIn ? 'Welcome back' : 'Join the room'}
            </p>
            <h2 className="section-whisper mt-8 max-w-[12ch]">
              {isSignIn ? 'Sign in quietly.' : 'Become a member.'}
            </h2>
            <p className="mt-8 max-w-md text-[18px] leading-[1.21] text-inkstone">
              Share work, gather for events, and keep conversations close. The interface stays still so the community can move.
            </p>
            <p className="mt-10 text-[16px] text-felt-gray">
              {isSignIn ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsSignIn(!isSignIn)}
                className="nav-link text-[16px] text-obsidian"
              >
                {isSignIn ? 'Register now' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="fade-in">
            {isSignIn ? <SignInForm /> : <RegisterForm />}
          </div>
        </div>
      </section>
    </div>
  );
}
