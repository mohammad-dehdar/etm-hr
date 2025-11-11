import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    // User is logged in, redirect to dashboard
    if (session.user.role === 'ADMIN') {
      redirect('/admin/dashboard')
    } else {
      redirect('/dashboard')
    }
  } else {
    // User is not logged in, redirect to login
    redirect('/login')
  }
}