'use client';

import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import defaultAvatar from '@/public/images/default-avatar.png';
import UserSearch from './UserSearch';

interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  isAdmin?: boolean;
}

const links = [
  { href: '/feed', label: 'Feed', match: (p: string) => p === '/feed' },
  { href: '/chat', label: 'Messages', match: (p: string) => p.startsWith('/chat') },
  { href: '/events', label: 'Events', match: (p: string) => p.startsWith('/events') },
];

export default function Navigation() {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!user) return null;

  const navItems = [
    ...links,
    ...(userProfile?.isAdmin
      ? [{ href: '/admin', label: 'Admin', match: (p: string) => p.startsWith('/admin') }]
      : []),
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[66px] bg-transparent">
      <div className="page-container flex h-full items-center justify-between gap-4">
        <Link href="/feed" className="nav-link shrink-0 text-[16px] text-obsidian">
          connecto
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link text-[11px] uppercase tracking-[0.14em] ${
                item.match(pathname) ? 'is-active text-obsidian' : 'text-felt-gray'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden max-w-xs flex-1 md:block lg:max-w-sm">
          <UserSearch />
        </div>

        <div className="flex items-center gap-3">
          <Menu as="div" className="relative">
            <Menu.Button className="block h-8 w-8 overflow-hidden border border-obsidian">
              <span className="sr-only">Open user menu</span>
              <Image
                className="avatar h-8 w-8"
                src={userProfile?.photoURL || defaultAvatar}
                alt=""
                width={32}
                height={32}
              />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
              enterFrom="transform opacity-0 -translate-y-1"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition duration-400 ease"
              leaveFrom="transform opacity-100"
              leaveTo="transform opacity-0"
            >
              <Menu.Items className="menu-panel absolute right-0 z-20 mt-3 w-48 origin-top-right py-3 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/profile"
                      className={`block px-4 py-2 text-[12px] ${active ? 'bg-obsidian text-paper' : 'text-obsidian'}`}
                    >
                      Your Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => auth.signOut()}
                      className={`block w-full px-4 py-2 text-left text-[12px] ${
                        active ? 'bg-obsidian text-paper' : 'text-obsidian'
                      }`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>

          <button
            type="button"
            className="inline-flex items-center justify-center p-1 text-obsidian lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Open menu"
          >
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          <div className="flex items-center justify-between">
            <span className="text-[16px]">connecto</span>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-10">
            <UserSearch />
          </div>

          <nav className="mt-16 flex flex-col gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[29px] font-light leading-none ${
                  item.match(pathname) ? 'text-paper' : 'text-ash-mist'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex items-center gap-4 pt-16">
            <Image
              className="avatar h-10 w-10"
              src={userProfile?.photoURL || defaultAvatar}
              alt=""
              width={40}
              height={40}
            />
            <div>
              <p className="text-[16px] text-paper">{userProfile?.displayName}</p>
              <p className="text-[11px] text-ash-mist">{userProfile?.email}</p>
            </div>
          </div>
          <div className="mt-8 flex gap-8 pb-4">
            <Link href="/profile" className="nav-link text-paper">
              Profile
            </Link>
            <button onClick={() => auth.signOut()} className="nav-link text-paper">
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
