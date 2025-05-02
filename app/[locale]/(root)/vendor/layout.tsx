import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from './sidebar'
import { SessionProvider } from 'next-auth/react'

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  // Check if user is a vendor
  if (!session.user.isVendor) {
    redirect('/account/become-seller')
  }

  return (
    <SessionProvider session={session}>
      <div className='flex h-screen'>
        <Sidebar />
        <main className='flex-1 overflow-y-auto p-8'>{children}</main>
      </div>
    </SessionProvider>
  )
} 