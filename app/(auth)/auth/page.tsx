'use client';

import { useState } from 'react';
import SignInForm from '@/components/auth/SignInForm';
import RegisterForm from '@/components/auth/RegisterForm';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isSignIn ? 'Welcome Back!' : 'Join Connecto+'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsSignIn(!isSignIn)}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isSignIn ? 'Register now' : 'Sign in'}
            </button>
          </p>
        </div>

        {isSignIn ? <SignInForm /> : <RegisterForm />}
      </div>
    </div>
  );
}