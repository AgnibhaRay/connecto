import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';

interface EventActionsProps {
  eventId: string;
  attendees: {
    id: string;
    name: string;
    photoURL?: string;
    status: 'going' | 'interested' | 'not_going';
  }[];
}

export default function EventActions({ eventId, attendees }: EventActionsProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const userAttendance = user ? attendees.find(a => a.id === user.uid) : null;

  const handleAttendance = async (status: 'going' | 'interested' | 'not_going') => {
    if (!user || isUpdating) return;
    setIsUpdating(true);

    const eventRef = doc(db, 'events', eventId);
    
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

  if (!user) {
    return <p className="text-felt-gray">Sign in to respond to this event</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => handleAttendance('going')}
        disabled={isUpdating}
        className={`btn-ghost ${userAttendance?.status === 'going' ? 'btn-filled border-paper' : ''}`}
      >
        Going
      </button>
      <button
        onClick={() => handleAttendance('interested')}
        disabled={isUpdating}
        className={`btn-ghost ${userAttendance?.status === 'interested' ? 'btn-filled border-paper' : ''}`}
      >
        Interested
      </button>
      <button
        onClick={() => handleAttendance('not_going')}
        disabled={isUpdating}
        className={`btn-ghost ${userAttendance?.status === 'not_going' ? 'btn-filled border-paper' : ''}`}
      >
        Not Going
      </button>
    </div>
  );
}