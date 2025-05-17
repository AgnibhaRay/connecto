// Server component (no 'use client' directive)
import EditPostClient from './EditPostClient';

export default function EditPostPage({ params }: { params: { id: string } }) {
  return <EditPostClient id={params.id} />;
}