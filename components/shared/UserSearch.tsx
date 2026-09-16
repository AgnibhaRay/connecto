'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function UserSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setIsFocused(false);
    router.push(`/profile?username=${user.username}`);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <span key={i} className="text-obsidian">{part}</span> : part
    );
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-felt-gray" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search users..."
          className="input-field py-2 pl-10 pr-4 text-[12px]"
        />
      </div>

      {(loading || searchResults.length > 0) && isFocused && (
        <div className="menu-panel absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="skeleton h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/4"></div>
                    <div className="skeleton h-3 w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => (
                <div
                  key={user.uid}
                  onClick={() => handleSelect(user)}
                  className="flex cursor-pointer items-center px-4 py-3 transition-colors duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] hover:bg-obsidian hover:text-paper"
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden">
                    <Image
                      src={user.photoURL || '/images/default-avatar.png'}
                      alt={user.displayName || ''}
                      className="avatar"
                      fill
                      sizes="40px"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-[14px]">
                      {highlightMatch(user.displayName, searchTerm)}
                    </p>
                    <p className="text-[12px] text-felt-gray">
                      @{highlightMatch(user.username, searchTerm)}
                    </p>
                  </div>
                  {user.isVerified && (
                    <span className="tag-pill ml-2">Verified</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {searchTerm.length > 1 && !loading && searchResults.length === 0 && isFocused && (
        <div className="menu-panel absolute left-0 right-0 top-full z-50 mt-1">
          <div className="p-4 text-center text-felt-gray">
            <div className="mb-1 text-[12px]">No users found</div>
            <div className="text-[11px]">Try a different search term</div>
          </div>
        </div>
      )}
    </div>
  );
}