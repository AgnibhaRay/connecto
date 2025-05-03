'use client';

import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function UserSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      // Search by username first
      const usernameQuery = query(
        usersRef,
        where('username', '>=', value.toLowerCase()),
        where('username', '<=', value.toLowerCase() + '\uf8ff')
      );

      // Search by displayName
      const displayNameQuery = query(
        usersRef,
        where('displayName', '>=', value),
        where('displayName', '<=', value + '\uf8ff')
      );

      // Execute both queries
      const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(displayNameQuery)
      ]);

      // Combine results and remove duplicates
      const usernameResults = usernameSnapshot.docs.map(doc => ({
        ...(doc.data() as UserProfile),
        uid: doc.id
      }));

      const displayNameResults = displayNameSnapshot.docs.map(doc => ({
        ...(doc.data() as UserProfile),
        uid: doc.id
      }));

      // Combine and remove duplicates using Set
      const combinedResults = [...usernameResults];
      displayNameResults.forEach(user => {
        if (!combinedResults.some(existing => existing.uid === user.uid)) {
          combinedResults.push(user);
        }
      });

      setSearchResults(combinedResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user: UserProfile) => {
    setSearchTerm('');
    setSearchResults([]);
    router.push(`/profile?username=${user.username}`);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {loading && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 shadow-lg p-2">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-64 overflow-y-auto">
          {searchResults.map((user) => (
            <div
              key={user.uid}
              onClick={() => handleSelect(user)}
              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
            >
              <Image
                src={user.photoURL || '/images/default-avatar.png'}
                alt={user.displayName || 'User avatar'}
                width={32}
                height={32}
                className="rounded-full mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">{user.displayName}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}