import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

// Update the API route handler with proper context typing that works with Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: Request, context: any) {
  try {
    const userRef = doc(db, 'users', context.params.id);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
