'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  payload: any
  readAt: Date | null
  createdAt: Date
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, readAt: new Date() } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const renderNotification = (notification: Notification) => {
    const { type, payload } = notification

    switch (type) {
      case 'birthday_digest':
        return {
          title: 'تولدتان مبارک! 🎉',
          message: payload.today?.length > 0 
            ? `امروز تولد ${payload.today.length} نفر است`
            : 'امروز کسی تولد ندارد'
        }
      case 'test_assigned':
        return {
          title: 'تست جدید',
          message: `تست "${payload.testTitle}" برای شما اختصاص یافته`
        }
      case 'form_assigned':
        return {
          title: 'فرم جدید',
          message: `فرم "${payload.formName}" برای تکمیل آماده است`
        }
      default:
        return {
          title: 'اعلان جدید',
          message: 'شما یک اعلان جدید دارید'
        }
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="px-3 py-2 border-b">
          <h3 className="font-semibold">اعلان‌ها</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>اعلانی وجود ندارد</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => {
              const { title, message } = renderNotification(notification)
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-3 cursor-pointer"
                  onClick={() => !notification.readAt && markAsRead(notification.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">{title}</span>
                    {!notification.readAt && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
        {notifications.length > 10 && (
          <div className="border-t px-3 py-2">
            <Button variant="ghost" size="sm" className="w-full">
              مشاهده همه اعلان‌ها
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}