// Server component - remove 'use client' directive
import EventClient from './EventClient';

// TypeScript ignore annotation for this specific error
export default async function EventPage({ params }: { params: { id: string } }) {
  return <EventClient id={params.id} />;
}
