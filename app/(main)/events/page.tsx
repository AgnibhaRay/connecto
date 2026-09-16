'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Event } from '@/types';
import EventCard from '@/components/events/EventCard';
import Link from 'next/link';
import PageShell from '@/components/shared/PageShell';

export default function EventsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const [eventsSnapshot] = useCollection(
    query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
  );

  const events = eventsSnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Event[] | undefined;

  if (loading) {
    return (
      <PageShell title="Events">
        <div className="space-y-3 p-4">
          <div className="skeleton h-48 w-full rounded-[18px]" />
          <div className="skeleton h-48 w-full rounded-[18px]" />
        </div>
      </PageShell>
    );
  }

  if (!user) return null;

  return (
    <PageShell title="Events">
      <div className="flex items-center justify-between border-b border-concrete px-4 py-3">
        <p className="text-[15px] text-graphite">Upcoming gatherings</p>
        <Link href="/events/create" className="btn-login">
          Create
        </Link>
      </div>
      <div>
        {events?.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {events?.length === 0 && (
          <p className="px-4 py-8 text-[15px] text-graphite">No events yet. Create one to get started.</p>
        )}
      </div>
    </PageShell>
  );
}
