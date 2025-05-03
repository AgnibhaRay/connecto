'use client';

import { Menu, Disclosure, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import defaultAvatar from '@/public/images/default-avatar.png';
import UserSearch from './UserSearch';

interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
}

export default function Navigation() {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <Disclosure as="nav" className="bg-white shadow-sm">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/feed" className="group">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent transform transition-all duration-300 ease-in-out group-hover:scale-105">
                        connecto
                      </span>
                      <span className="text-2xl font-bold text-purple-600 animate-pulse">+</span>
                    </div>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/feed"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      pathname === '/feed'
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Feed
                  </Link>
                  <Link
                    href="/events"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      pathname.startsWith('/events')
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Events
                  </Link>
                </div>
              </div>
              
              <div className="hidden sm:flex sm:items-center sm:w-96">
                <UserSearch />
              </div>

              <div className="flex items-center">
                <Menu as="div" className="relative ml-3">
                  <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <span className="sr-only">Open user menu</span>
                    <Image
                      className="h-8 w-8 rounded-full"
                      src={userProfile?.photoURL || defaultAvatar}
                      alt=""
                      width={32}
                      height={32}
                    />
                  </Menu.Button>
                  <Transition
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={`/profile`}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700`}
                          >
                            Your Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => auth.signOut()}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                          >
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-black hover:bg-gray-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-200">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="p-3">
              <UserSearch />
            </div>
            <div className="space-y-1 pb-3 pt-2">
              <Link
                href="/feed"
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                  pathname === '/feed'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                Feed
              </Link>
              <Link
                href="/events"
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                  pathname.startsWith('/events')
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                Events
              </Link>
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <Image
                    className="h-10 w-10 rounded-full"
                    src={userProfile?.photoURL || defaultAvatar}
                    alt=""
                    width={40}
                    height={40}
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {userProfile?.displayName}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {userProfile?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  Your Profile
                </Link>
                <button
                  onClick={() => auth.signOut()}
                  className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}