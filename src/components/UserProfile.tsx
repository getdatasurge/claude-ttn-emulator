/**
 * UserProfile Component
 * Displays logged-in user info with logout functionality
 */

import { useNavigate } from 'react-router-dom'
import { useStackAuth } from '@/lib/stackAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, User } from 'lucide-react'

export function UserProfile() {
  const navigate = useNavigate()
  const { user, isAuthenticated, email, displayName, role } = useStackAuth()

  const handleLogout = async () => {
    if (user) {
      await user.signOut()
      navigate('/login')
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {displayName || email}
          </span>
          {role && (
            <Badge variant="default" className="text-xs w-fit">
              {role}
            </Badge>
          )}
        </div>
      </div>

      <Button
        onClick={handleLogout}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
