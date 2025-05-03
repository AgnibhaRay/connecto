'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Event } from '@/types';
import Navigation from '@/components/shared/Navigation';
import EventCard from '@/components/events/EventCard';
import Link from 'next/link';

export default function EventsPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Get events with real-time updates
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
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-60 bg-white rounded-lg shadow" />
            <div className="h-60 bg-white rounded-lg shadow" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <Link 
            href="/events/create" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Create Event
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {events?.length === 0 && (
            <div className="text-center py-8 col-span-full">
              <p className="text-gray-500">No events yet. Create one to get started!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}