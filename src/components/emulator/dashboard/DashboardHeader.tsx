/**
 * Dashboard Header - Status filters, device selector, and controls
 */

import { Radio, Settings, RefreshCw, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isStackAuthConfigured } from '@/lib/stackAuth'
import type { DeviceFilter } from './types'

// Lazy load UserProfile only when Stack Auth is configured
const UserProfile = isStackAuthConfigured
  ? require('@/components/UserProfile').UserProfile
  : null

interface Device {
  id: string
  name: string
  device_type: string
  status: string
}

interface DashboardHeaderProps {
  filter: DeviceFilter
  onFilterChange: (filter: DeviceFilter) => void
  deviceCounts: {
    all: number
    active: number
    inactive: number
    error: number
  }
  devices: Device[]
  selectedDeviceId: string | null
  onDeviceSelect: (id: string) => void
}

export function DashboardHeader({
  filter,
  onFilterChange,
  deviceCounts,
  devices,
  selectedDeviceId,
  onDeviceSelect,
}: DashboardHeaderProps) {
  const filters: { key: DeviceFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: deviceCounts.all },
    { key: 'active', label: 'Active', count: deviceCounts.active },
    { key: 'inactive', label: 'Stopped', count: deviceCounts.inactive },
    { key: 'error', label: 'Error', count: deviceCounts.error },
  ]

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              LoRaWAN Device Emulator
            </h1>
          </div>

          {/* Center: Filter Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {filters.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${filter === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs ${filter === key ? 'text-primary' : 'text-muted-foreground'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right: Device Selector and Controls */}
          <div className="flex items-center gap-3">
            {/* Device Selector */}
            <Select
              value={selectedDeviceId || ''}
              onValueChange={onDeviceSelect}
            >
              <SelectTrigger className="w-[200px] bg-muted/50 border-border">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {devices.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No devices available
                  </SelectItem>
                ) : (
                  devices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            device.status === 'active'
                              ? 'bg-primary'
                              : device.status === 'error'
                              ? 'bg-destructive'
                              : 'bg-muted-foreground'
                          }`}
                        />
                        {device.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Action Buttons */}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>

            {/* User Profile */}
            {UserProfile ? (
              <UserProfile />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
