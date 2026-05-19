'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-indigo-700 transition-colors">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">ExpenseHub</span>
            </Link>
            {(session.user as any)?.role === 'ADMIN' && (
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/admin" className="text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Admin Panel
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 px-2 sm:px-3 py-1.5 rounded-full border border-slate-200 max-w-[150px] sm:max-w-none">
              <UserIcon className="h-4 w-4 mr-1 sm:mr-2 text-indigo-500 flex-shrink-0" />
              <span className="truncate">{session.user?.name}</span>
              <span className="hidden sm:inline mx-2 text-slate-300">|</span>
              <span className="hidden sm:inline text-indigo-600 font-semibold text-xs">{(session.user as any)?.role}</span>
            </div>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center justify-center p-2 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
