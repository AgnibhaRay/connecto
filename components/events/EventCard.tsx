'use client';

import { Event } from '@/types';
import Image from 'next/image';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const userAttendance = event.attendees.find(a => a.id === user?.uid);
  const formattedDate = format(new Date(event.date), 'EEE, MMM d, yyyy');
  const formattedTime = format(new Date(`${event.date}T${event.time}`), 'h:mm a');

  const handleAttendance = async (status: 'going' | 'interested' | 'not_going') => {
    if (!user || isUpdating) return;
    setIsUpdating(true);

    const eventRef = doc(db, 'events', event.id);
    
    try {
      // Remove existing attendance status if any
      if (userAttendance) {
        await updateDoc(eventRef, {
          attendees: arrayRemove(userAttendance)
        });
      }

      // Add new attendance status if not "not_going"
      if (status !== 'not_going') {
        await updateDoc(eventRef, {
          attendees: arrayUnion({
            id: user.uid,
            name: user.displayName || '',
            photoURL: user.photoURL || '',
            status
          })
        });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    }

    setIsUpdating(false);
  };

  return (
    <div className="post-card">
      <Link href={`/events/${event.id}`} className="block">
        <div className="media-frame relative h-48 w-full bg-hover-mist">
          <Image
            src={event.coverImage || '/images/event-placeholder.jpg'}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      <div className="pt-3">
        <Link href={`/events/${event.id}`}>
          <h3 className="mb-1 text-[15px] font-semibold text-ink">{event.title}</h3>
        </Link>

        <div className="mb-3 space-y-1 text-[13px] text-graphite">
          <p className="flex items-center">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {formattedDate} at {formattedTime}
          </p>
          <p className="flex items-center">
            <LocationIcon className="mr-1 h-4 w-4" />
            {event.isOnline ? 'Online Event' : event.location}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex -space-x-2">
            {event.attendees
              .filter(a => a.status === 'going')
              .slice(0, 3)
              .map((attendee) => (
                <div key={attendee.id} className="relative h-8 w-8 overflow-hidden rounded-full border border-card">
                  <Image
                    src={attendee.photoURL || '/images/default-avatar.png'}
                    alt={attendee.name}
                    fill
                    className="avatar"
                  />
                </div>
              ))}
            {event.attendees.filter(a => a.status === 'going').length > 3 && (
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-concrete bg-card">
                <span className="text-[12px] font-bold text-graphite">
                  +{event.attendees.filter(a => a.status === 'going').length - 3}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAttendance('going')}
              disabled={isUpdating}
              className={`btn-follow btn-sm ${
                userAttendance?.status === 'going' ? 'is-active' : ''
              }`}
            >
              Going
            </button>
            <button
              onClick={() => handleAttendance('interested')}
              disabled={isUpdating}
              className={`btn-ghost btn-sm ${
                userAttendance?.status === 'interested' ? 'btn-login' : ''
              }`}
            >
              Interested
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LocationIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}