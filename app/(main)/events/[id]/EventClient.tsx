'use client';

import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { CalendarIcon, LocationIcon } from '@/components/shared/Icons';
import { format } from 'date-fns';
import EventActions from '@/components/events/EventActions';
import { useEffect, useState } from 'react';
import { Event } from '@/types';
import PageShell from '@/components/shared/PageShell';

async function getEvent(id: string) {
  const eventRef = doc(db, 'events', id);
  const eventDoc = await getDoc(eventRef);
  
  if (!eventDoc.exists()) {
    return null;
  }
  
  return {
    id: eventDoc.id,
    ...eventDoc.data()
  } as Event;
}

export default function EventClient({ id }: { id: string }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    async function loadEvent() {
      const eventData = await getEvent(id);
      setEvent(eventData);
      setLoading(false);
    }
    loadEvent();

    // Set up real-time listener
    const eventRef = doc(db, 'events', id);
    const unsubscribe = onSnapshot(eventRef, (doc) => {
      if (doc.exists()) {
        setEvent({
          id: doc.id,
          ...doc.data()
        } as Event);
      } else {
        setEvent(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-6">
          <div className="skeleton h-96 w-full"></div>
          <div className="skeleton h-8 w-3/4"></div>
          <div className="skeleton h-4 w-1/2"></div>
          <div className="skeleton h-20 w-full"></div>
        </div>
      </PageShell>
    );
  }
  
  if (!event) {
    notFound();
  }

  const formattedDate = format(new Date(event.date), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(`${event.date}T${event.time}`), 'h:mm a');
  
  return (
    <PageShell>
      <div className="relative mb-8 h-96 w-full overflow-hidden bg-ash-mist">
        <Image
          src={event.coverImage || '/images/event-placeholder.jpg'}
          alt={event.title}
          fill
          className="object-cover"
        />
      </div>

      <p className="label-micro text-felt-gray">Event</p>
      <h1 className="section-whisper mt-4 mb-8">{event.title}</h1>

      <div className="mb-8 flex flex-col space-y-4">
        <div className="flex items-center text-inkstone">
          <CalendarIcon className="mr-2 h-5 w-5" />
          <span>{formattedDate} at {formattedTime}</span>
        </div>

        <div className="flex items-center text-inkstone">
          <LocationIcon className="mr-2 h-5 w-5" />
          {event.isOnline ? (
            <div>
              <span className="block">Online Event</span>
              {event.meetingLink && (
                <a
                  href={event.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link text-obsidian"
                >
                  Join Meeting
                </a>
              )}
            </div>
          ) : (
            <span>{event.location}</span>
          )}
        </div>
      </div>

      <div className="mb-8">
        <EventActions eventId={event.id} attendees={event.attendees} />
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-[16px] text-obsidian">About this event</h2>
        <p className="whitespace-pre-wrap text-inkstone">{event.description}</p>
      </div>

      <div>
        <h2 className="mb-4 text-[16px] text-obsidian">Organizer</h2>
        <div className="flex items-center">
          <Image
            src={event.organizer.photoURL || '/images/default-avatar.png'}
            alt={event.organizer.name}
            width={48}
            height={48}
            className="avatar"
          />
          <span className="ml-3 text-obsidian">{event.organizer.name}</span>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-[16px] text-obsidian">Attendees</h2>
        <div className="flex flex-wrap gap-4">
          {event.attendees
            .filter(attendee => attendee.status === 'going')
            .map((attendee) => (
              <div key={attendee.id} className="flex items-center">
                <Image
                  src={attendee.photoURL || '/images/default-avatar.png'}
                  alt={attendee.name}
                  width={40}
                  height={40}
                  className="avatar"
                />
                <span className="ml-2 text-[14px] text-obsidian">{attendee.name}</span>
              </div>
            ))}
        </div>
      </div>
    </PageShell>
  );
}
