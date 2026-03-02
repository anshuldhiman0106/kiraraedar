'use client'

import { useAuth } from '../../../hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Welcome back, {user.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Your shadcn UI components will go here */}
          <div className="bg-white p-8 rounded-xl shadow-lg border">
            <h3 className="text-xl font-semibold mb-4">User ID</h3>
            <p className="text-2xl font-bold text-gray-900 break-all">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
