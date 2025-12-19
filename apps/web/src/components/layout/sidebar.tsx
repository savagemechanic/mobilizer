'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, MessageCircle, Compass, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Feeds', href: '/feeds', icon: Home },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Profile', href: '/profile/edit', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
