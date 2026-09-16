'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import PageShell from '@/components/shared/PageShell';
import toast from 'react-hot-toast';
import { processImageFile, isHeicFile } from '@/lib/utils/imageUtils';

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isOnline, setIsOnline] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a HEIC file and notify the user
      if (isHeicFile(file)) {
        toast.success('Converting HEIC image to JPEG format...');
      }
      
      setCoverImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const validateForm = (data: FormData) => {
    const errors: Record<string, string> = {};
    
    if (!data.get('title')?.toString().trim()) {
      errors.title = 'Title is required';
    }
    
    if (!data.get('description')?.toString().trim()) {
      errors.description = 'Description is required';
    }

    const eventDate = new Date(data.get('date')?.toString() || '');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      errors.date = 'Event date cannot be in the past';
    }

    if (isOnline && !data.get('meetingLink')?.toString().trim()) {
      errors.meetingLink = 'Meeting link is required for online events';
    }

    return errors;
  };

  const handleIsOnlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOnline(e.target.checked);
    if (!e.target.checked) {
      const locationInput = document.getElementById('location') as HTMLInputElement;
      if (locationInput?.value === 'Online') {
        locationInput.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      let coverImageUrl = '';
      if (coverImage) {
        try {
          // Process the image (convert HEIC to JPEG if needed)
          const processedImage = await processImageFile(coverImage);
          
          // Upload the processed image
          const storageRef = ref(storage, `events/${Date.now()}-${processedImage.name}`);
          await uploadBytes(storageRef, processedImage);
          coverImageUrl = await getDownloadURL(storageRef);
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          toast.error('There was an issue processing your image, but we\'ll try to upload it anyway.');
          
          // Try to upload the original image as a fallback
          try {
            const storageRef = ref(storage, `events/${Date.now()}-${coverImage.name}`);
            await uploadBytes(storageRef, coverImage);
            coverImageUrl = await getDownloadURL(storageRef);
          } catch (uploadError) {
            console.error('Fallback upload error:', uploadError);
            toast.error('Unable to upload event cover image. Your event will be created without an image.');
          }
        }
      }

      const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        time: formData.get('time'),
        location: formData.get('location'),
        isOnline: formData.get('isOnline') === 'true',
        meetingLink: formData.get('meetingLink'),
        category: formData.get('category'),
        coverImage: coverImageUrl,
        organizer: {
          id: user.uid,
          name: user.displayName || '',
          photoURL: user.photoURL || '',
        },
        attendees: [{
          id: user.uid,
          name: user.displayName || '',
          photoURL: user.photoURL || '',
          status: 'going'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'events'), eventData);
      // Wait for a moment to ensure state updates are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      // Use replace instead of push to avoid back navigation issues
      router.replace('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      setFormErrors({ submit: 'Failed to create event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <p className="label-micro text-felt-gray">New gathering</p>
      <h1 className="section-whisper mb-[46px] mt-4">Create Event</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            {formErrors.submit && (
              <div className="  p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-obsidian">{formErrors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="title" className="field-label">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className={`input-field ${formErrors.title ? "border-obsidian" : ""}`}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-obsidian">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="field-label">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                required
                className="input-field"
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-obsidian">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="field-label">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
                {formErrors.date && (
                  <p className="mt-1 text-sm text-obsidian">{formErrors.date}</p>
                )}
              </div>

              <div>
                <label htmlFor="time" className="field-label">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  id="time"
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="field-label">
                Category
              </label>
              <select
                name="category"
                id="category"
                required
                className="select-field"
              >
                <option value="">Select a category</option>
                <option value="social">Social</option>
                <option value="academic">Academic</option>
                <option value="professional">Professional</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name="isOnline"
                  id="isOnline"
                  checked={isOnline}
                  onChange={handleIsOnlineChange}
                  value="true"
                  className="h-4 w-4 rounded border-obsidian text-obsidian "
                />
                <label htmlFor="isOnline" className="ml-2 block text-sm text-obsidian">
                  This is an online event
                </label>
              </div>
              
              <div className="mt-2">
                <label htmlFor="location" className="field-label">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  defaultValue={isOnline ? 'Online' : ''}
                  className="input-field"
                  placeholder={isOnline ? 'Online' : 'Enter location'}
                />
                {formErrors.location && (
                  <p className="mt-1 text-sm text-obsidian">{formErrors.location}</p>
                )}
              </div>

              {isOnline && (
                <div className="mt-2">
                  <label htmlFor="meetingLink" className="field-label">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    id="meetingLink"
                    required
                    className="input-field"
                    placeholder="https://..."
                  />
                  {formErrors.meetingLink && (
                    <p className="mt-1 text-sm text-obsidian">{formErrors.meetingLink}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="field-label">Cover Image</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-obsidian border-dashed ">
                <div className="space-y-1 text-center">
                  {previewUrl ? (
                    <div className="relative h-32 w-full">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="mx-auto object-cover"
                      />
                    </div>
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-ash-mist"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-felt-gray">
                    <label htmlFor="coverImage" className="nav-link cursor-pointer text-obsidian">
                      <span>Upload a file</span>
                      <input
                        id="coverImage"
                        name="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-felt-gray">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-ghost"
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
    </PageShell>
  );
}