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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Event Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none p-2 text-black"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none p-2 text-black"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          required
          value={formData.location}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none p-2 text-black"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={formData.date}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none p-2 text-black"
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700">
            Time
          </label>
          <input
            type="time"
            id="time"
            name="time"
            required
            value={formData.time}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none p-2 text-black"
          />
        </div>
      </div>

      <div>
        <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700">
          Maximum Attendees (optional)
        </label>
        <input
          type="number"
          id="maxAttendees"
          name="maxAttendees"
          min="1"
          value={formData.maxAttendees || ''}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none p-2 text-black"
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
        <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
          Make this event private
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Event
        </button>
      </div>
    </form>
  );
}