/**
 * Emulator Dashboard - Main dashboard layout matching mockup
 * Two-column layout: Monitor (left) + Local Emulator State (right)
 */

import { useState, useEffect } from 'react'
import { MonitorSection } from './MonitorSection'
import { EmulatorStateSection } from './EmulatorStateSection'
import { DashboardHeader } from './DashboardHeader'
import { useDevices } from '@/hooks/useDevices'
import type { DeviceFilter } from './types'

export function EmulatorDashboard() {
  const [filter, setFilter] = useState<DeviceFilter>('all')
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const { devices, isLoading } = useDevices()

  // Auto-select first device when loaded
  useEffect(() => {
    if (devices && devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id)
    }
  }, [devices, selectedDeviceId])

  const filteredDevices = devices?.filter(device => {
    if (filter === 'all') return true
    if (filter === 'active') return device.status === 'active'
    if (filter === 'inactive') return device.status === 'inactive'
    if (filter === 'error') return device.status === 'error'
    return true
  }) || []

  const selectedDevice = devices?.find(d => d.id === selectedDeviceId) || null

  const deviceCounts = {
    all: devices?.length || 0,
    active: devices?.filter(d => d.status === 'active').length || 0,
    inactive: devices?.filter(d => d.status === 'inactive').length || 0,
    error: devices?.filter(d => d.status === 'error').length || 0,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <DashboardHeader
        filter={filter}
        onFilterChange={setFilter}
        deviceCounts={deviceCounts}
        devices={filteredDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={setSelectedDeviceId}
      />

      {/* Main Content - Two Column Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Monitor */}
          <MonitorSection
            device={selectedDevice}
            isLoading={isLoading}
          />

          {/* Right Column - Local Emulator State */}
          <EmulatorStateSection
            device={selectedDevice}
            devices={filteredDevices}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
