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

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    async function loadEvent() {
      const eventData = await getEvent(params.id);
      setEvent(eventData);
      setLoading(false);
    }
    loadEvent();

    // Set up real-time listener
    const eventRef = doc(db, 'events', params.id);
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
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-pulse">
            <div className="h-96 w-full bg-gray-200 mb-8"></div>
            <div className="h-8 w-3/4 bg-gray-200 mb-4"></div>
            <div className="h-4 w-1/2 bg-gray-200 mb-8"></div>
            <div className="h-20 w-full bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    notFound();
  }

  const formattedDate = format(new Date(event.date), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(`${event.date}T${event.time}`), 'h:mm a');
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-96 w-full">
          <Image
            src={event.coverImage || '/images/event-placeholder.jpg'}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="p-8">
          <h1 className="text-3xl font-bold text-black mb-4">{event.title}</h1>
          
          <div className="flex flex-col space-y-4 mb-8">
            <div className="flex items-center text-black">
              <CalendarIcon className="h-5 w-5 mr-2" />
              <span>{formattedDate} at {formattedTime}</span>
            </div>
            
            <div className="flex items-center text-black">
              <LocationIcon className="h-5 w-5 mr-2" />
              {event.isOnline ? (
                <div>
                  <span className="block">Online Event</span>
                  {event.meetingLink && (
                    <a 
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
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
          
          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-2 text-black">About this event</h2>
            <p className="whitespace-pre-wrap text-black">{event.description}</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4 text-black">Organizer</h2>
            <div className="flex items-center">
              <Image
                src={event.organizer.photoURL || '/images/default-avatar.png'}
                alt={event.organizer.name}
                width={48}
                height={48}
                className="rounded-full"
              />
              <span className="ml-3 font-medium text-black">{event.organizer.name}</span>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-black">Attendees</h2>
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
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-black">{attendee.name}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}