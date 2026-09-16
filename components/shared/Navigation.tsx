'use client';

import { Menu, Transition } from '@headlessui/react';
import {
  CalendarIcon,
  ChatBubbleLeftIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  CalendarIcon as CalendarSolid,
  ChatBubbleLeftIcon as ChatSolid,
  HomeIcon as HomeSolid,
  ShieldCheckIcon as ShieldSolid,
  UserIcon as UserSolid,
} from '@heroicons/react/24/solid';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import defaultAvatar from '@/public/images/default-avatar.png';
import UserSearch from './UserSearch';
import { LogoMark } from './Logo';

interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  isAdmin?: boolean;
}

export default function Navigation({ title = 'Home' }: { title?: string }) {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
    setSearchOpen(false);
  }, [pathname]);

  const items = [
    { href: '/feed', label: 'Home', match: (p: string) => p === '/feed', Icon: HomeIcon, ActiveIcon: HomeSolid },
    { href: '/events', label: 'Events', match: (p: string) => p.startsWith('/events'), Icon: CalendarIcon, ActiveIcon: CalendarSolid },
    { href: '/chat', label: 'Messages', match: (p: string) => p.startsWith('/chat'), Icon: ChatBubbleLeftIcon, ActiveIcon: ChatSolid },
    { href: '/profile', label: 'Profile', match: (p: string) => p.startsWith('/profile'), Icon: UserIcon, ActiveIcon: UserSolid },
    ...(userProfile?.isAdmin
      ? [{ href: '/admin', label: 'Admin', match: (p: string) => p.startsWith('/admin'), Icon: ShieldCheckIcon, ActiveIcon: ShieldSolid }]
      : []),
  ];

  const goCompose = () => {
    if (pathname === '/feed') {
      document.getElementById('compose')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    router.push('/feed#compose');
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-concrete bg-card px-4 md:hidden">
        <LogoMark className="h-7 w-7 text-ink" />
        <h1 className="text-[17px] font-bold tracking-tight">{title}</h1>
        {user ? (
          <Menu as="div" className="relative">
            <Menu.Button className="block h-8 w-8 overflow-hidden rounded-full">
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
              enter="transition duration-150 ease-out"
              enterFrom="opacity-0 -translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition duration-100 ease-in"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Menu.Items className="menu-panel absolute right-0 z-20 mt-2 w-44 origin-top-right py-2 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/profile"
                      className={`block px-4 py-2 text-[15px] ${active ? 'bg-hover-mist' : 'text-ink'}`}
                    >
                      Your Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => auth.signOut()}
                      className={`block w-full px-4 py-2 text-left text-[15px] ${active ? 'bg-hover-mist' : 'text-ink'}`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        ) : (
          <Link href="/auth" className="btn-login py-2 px-4 text-[13px]">
            Log in
          </Link>
        )}
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col border-r border-concrete bg-card px-3 py-4 lg:w-[244px] md:flex">
          <Link href="/feed" className="mb-6 flex h-12 items-center justify-center rounded-full hover:bg-hover-mist lg:justify-start lg:px-3" aria-label="Connecto">
            <LogoMark className="h-8 w-8" />
            <span className="ml-3 hidden text-[20px] font-bold tracking-tight lg:inline">Connecto</span>
          </Link>

          <nav className="flex flex-1 flex-col items-center gap-1 lg:items-stretch">
            {items.map((item) => {
              const active = item.match(pathname);
              const Icon = active ? item.ActiveIcon : item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={`sidebar-link ${active ? 'is-active' : ''}`}
                >
                  <Icon className="h-7 w-7 shrink-0" strokeWidth={1.6} />
                  <span className="hidden text-[19px] lg:inline">{item.label}</span>
                </Link>
              );
            })}
            {user && (
              <>
                <button type="button" aria-label="Search" className="sidebar-link" onClick={() => setSearchOpen(true)}>
                  <MagnifyingGlassIcon className="h-7 w-7 shrink-0" strokeWidth={1.6} />
                  <span className="hidden text-[19px] lg:inline">Search</span>
                </button>
                <button type="button" aria-label="Compose" className="icon-btn compose-btn mt-3 lg:hidden" onClick={goCompose}>
                  <PlusIcon className="h-6 w-6" strokeWidth={2} />
                </button>
                <button type="button" className="btn-login mt-3 hidden h-12 w-full text-[16px] lg:inline-flex" onClick={goCompose}>
                  Post
                </button>
              </>
            )}
            {!user && (
              <Link href="/auth" className="btn-login mt-3 hidden h-12 w-full text-[16px] lg:inline-flex">
                Log in
              </Link>
            )}
          </nav>

          {user && (
            <Menu as="div" className="relative mt-auto">
              <Menu.Button className="flex w-full items-center justify-center gap-3 rounded-full p-2 hover:bg-hover-mist lg:justify-start">
                <Image
                  className="avatar h-10 w-10"
                  src={userProfile?.photoURL || defaultAvatar}
                  alt=""
                  width={40}
                  height={40}
                />
                <span className="hidden min-w-0 flex-1 text-left lg:block">
                  <span className="block truncate text-[15px] font-semibold">{userProfile?.displayName || 'You'}</span>
                  <span className="block truncate text-[13px] text-graphite">{userProfile?.email}</span>
                </span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition duration-150 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-100 ease-in"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Menu.Items className="menu-panel absolute bottom-14 left-0 z-20 w-56 py-2 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/profile" className={`block px-4 py-2 text-[15px] ${active ? 'bg-hover-mist' : ''}`}>
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => auth.signOut()}
                        className={`block w-full px-4 py-2 text-left text-[15px] ${active ? 'bg-hover-mist' : ''}`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </aside>

      {user && (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-concrete bg-card px-2 md:hidden">
          {items.slice(0, 4).map((item) => {
            const active = item.match(pathname);
            const Icon = active ? item.ActiveIcon : item.Icon;
            return (
              <Link key={item.href} href={item.href} aria-label={item.label} className="icon-btn">
                <Icon className="h-7 w-7" strokeWidth={1.6} />
              </Link>
            );
          })}
          <button type="button" aria-label="Search" className="icon-btn" onClick={() => setSearchOpen(true)}>
            <MagnifyingGlassIcon className="h-7 w-7" strokeWidth={1.6} />
          </button>
        </nav>
      )}

      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-panel" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[17px] font-bold">Search</p>
              <button type="button" className="text-[15px] font-semibold text-graphite" onClick={() => setSearchOpen(false)}>
                Close
              </button>
            </div>
            <UserSearch />
          </div>
        </div>
      )}
    </>
  );
}
