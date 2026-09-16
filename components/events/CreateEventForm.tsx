'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

interface EventFormData {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  maxAttendees?: number;
  isPrivate: boolean;
}

export default function CreateEventForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    date: '',
    time: '',
    maxAttendees: undefined,
    isPrivate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create an event');
      }

      const eventData = {
        ...formData,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        attendees: [user.uid],
        dateTime: Timestamp.fromDate(new Date(`${formData.date}T${formData.time}`)),
      };

      await addDoc(collection(db, 'events'), eventData);
      router.push('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      // You might want to add proper error handling here
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="field-label">
          Event Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleInputChange}
          className="input-field mt-1"
        />
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="input-field mt-1"
        />
      </div>

      <div>
        <label htmlFor="location" className="field-label">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          required
          value={formData.location}
          onChange={handleInputChange}
          className="input-field mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="field-label">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={formData.date}
            onChange={handleInputChange}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="time" className="field-label">
            Time
          </label>
          <input
            type="time"
            id="time"
            name="time"
            required
            value={formData.time}
            onChange={handleInputChange}
            className="input-field mt-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="maxAttendees" className="field-label">
          Maximum Attendees (optional)
        </label>
        <input
          type="number"
          id="maxAttendees"
          name="maxAttendees"
          min="1"
          value={formData.maxAttendees || ''}
          onChange={handleInputChange}
          className="input-field mt-1"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPrivate"
          name="isPrivate"
          checked={formData.isPrivate}
          onChange={handleCheckboxChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isPrivate" className="ml-2 block text-[14px] text-inkstone">
          Make this event private
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-ghost"
        >
          Create Event
        </button>
      </div>
    </form>
  );
}