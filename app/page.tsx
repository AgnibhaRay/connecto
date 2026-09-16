'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/feed');
      } else {
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="hero-iridescent flex min-h-screen items-center justify-center">
        <p className="relative z-10 text-[12px] tracking-[0.2em] text-paper">Loading</p>
      </div>
    );
  }

  return null;
}
