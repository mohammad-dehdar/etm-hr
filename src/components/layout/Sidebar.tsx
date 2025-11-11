'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  User,
  FileText,
  Brain,
  Bell,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Shield
} from 'lucide-react'

interface SidebarProps {
  isAdmin: boolean
}

const navigation = [
  // Employee navigation
  {
    name: 'داشبورد',
    href: '/dashboard',
    icon: LayoutDashboard,
    adminOnly: false
  },
  {
    name: 'پروفایل',
    href: '/dashboard/profile',
    icon: User,
    adminOnly: false
  },
  {
    name: 'تست‌ها',
    href: '/dashboard/tests',
    icon: Brain,
    adminOnly: false
  },
  {
    name: 'اعلان‌ها',
    href: '/dashboard/notifications',
    icon: Bell,
    adminOnly: false
  },
  // Admin navigation
  {
    name: 'داشبورد مدیریت',
    href: '/admin/dashboard',
    icon: Shield,
    adminOnly: true
  },
  {
    name: 'مدیریت کاربران',
    href: '/admin/users',
    icon: Users,
    adminOnly: true
  },
  {
    name: 'مدیریت فرم‌ها',
    href: '/admin/forms',
    icon: FileText,
    adminOnly: true
  },
  {
    name: 'مدیریت تست‌ها',
    href: '/admin/tests',
    icon: Brain,
    adminOnly: true
  },
  {
    name: 'گزارش‌ها',
    href: '/admin/reports',
    icon: BarChart3,
    adminOnly: true
  },
  {
    name: 'تنظیمات سیستم',
    href: '/admin/settings',
    icon: Settings,
    adminOnly: true
  }
]

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()

  const visibleNavigation = navigation.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  )

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="ml-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>PeoplePulse v1.0</p>
          <p>سیستم مدیریت منابع انسانی</p>
        </div>
      </div>
    </div>
  )
}