'use client';

import EditPostClient from './EditPostClient';

export default function EditPostPage({ params }) {
  return <EditPostClient id={params.id} />;
}
