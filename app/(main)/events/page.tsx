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
      <PageShell>
        <div className="space-y-[46px]">
          <div className="skeleton h-60 w-full" />
          <div className="skeleton h-60 w-full" />
        </div>
      </PageShell>
    );
  }

  if (!user) return null;

  return (
    <PageShell>
      <div className="mb-[46px] flex items-end justify-between gap-6">
        <div>
          <p className="label-micro text-felt-gray">Gatherings</p>
          <h1 className="section-whisper mt-4">Events.</h1>
        </div>
        <Link href="/events/create" className="btn-ghost shrink-0">
          Create Event
        </Link>
      </div>
      <div className="space-y-[46px]">
        {events?.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {events?.length === 0 && (
          <p className="text-felt-gray">No events yet. Create one to get started.</p>
        )}
      </div>
    </PageShell>
  );
}
