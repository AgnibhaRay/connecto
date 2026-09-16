'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/types';
import PageShell from '@/components/shared/PageShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        redirect('/auth');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists() || !(userSnap.data() as UserProfile).isAdmin) {
        redirect('/feed');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  if (loading) {
    return (
      <PageShell title="Admin">
        <p className="px-4 py-8 text-center text-[13px] text-graphite">Loading...</p>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <PageShell title="Admin">
      {children}
    </PageShell>
  );
}