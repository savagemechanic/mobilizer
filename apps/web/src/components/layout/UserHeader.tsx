'use client'

import Link from 'next/link'
import { UserMenuDropdown } from '@/organisms'
import { NotificationBell, SearchBar } from '@/molecules'

export function UserHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <Link href="/feeds" className="font-bold text-xl">
          Mobilizer
        </Link>

        <SearchBar className="flex-1" />

        <div className="flex items-center gap-4">
          <NotificationBell variant="user" />
          <UserMenuDropdown variant="user" />
        </div>
      </div>
    </header>
  )
}
