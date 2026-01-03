/**
 * LoRaWANEmulator Component
 * Main orchestrator for the device emulator interface
 */

import { useState, useEffect, useRef } from 'react'
import { DeviceManager } from './DeviceManager'
import { WebhookSettings } from './WebhookSettings'
import { TelemetryChart } from './TelemetryChart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Radio, PlayCircle, StopCircle, Settings, Activity } from 'lucide-react'
import { useDevices } from '@/hooks/useDevices'
import { simulateTTNUplink } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export function LoRaWANEmulator() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeTab, setActiveTab] = useState('devices')
  const { devices } = useDevices()
  const { toast } = useToast()
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setActiveTab('telemetry')
  }

  const simulateUplinks = async () => {
    const activeDevices = devices.filter((d) => d.status === 'active')

    if (activeDevices.length === 0) {
      toast({
        title: 'No active devices',
        description: 'Add some devices with active status to start simulation',
        variant: 'destructive',
      })
      setIsSimulating(false)
      return
    }

    for (const device of activeDevices) {
      try {
        await simulateTTNUplink(device.id, {})
      } catch (error) {
        console.error(`Failed to simulate uplink for ${device.name}:`, error)
      }
    }
  }

  const toggleSimulation = () => {
    if (!isSimulating) {
      // Start simulation
      setIsSimulating(true)
      simulateUplinks() // Send immediately
      simulationIntervalRef.current = setInterval(simulateUplinks, 60000) // Every 60 seconds

      toast({
        title: 'Simulation started',
        description: 'Sending uplinks every 60 seconds',
      })
    } else {
      // Stop simulation
      setIsSimulating(false)
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
        simulationIntervalRef.current = null
      }

      toast({
        title: 'Simulation stopped',
        description: 'No more uplinks will be sent',
      })
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="container mx-auto py-8 px-4 space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Radio className="h-10 w-10 text-primary animate-pulse" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FrostGuard
            </span>
            <span>LoRaWAN Emulator</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Industrial refrigeration monitoring simulator
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Badge
            variant={isSimulating ? 'default' : 'secondary'}
            className="px-4 py-2 text-sm font-mono"
          >
            {isSimulating && <span className="status-active mr-2" />}
            {isSimulating ? 'SIMULATION ACTIVE' : 'SIMULATION IDLE'}
          </Badge>

          <Button
            onClick={toggleSimulation}
            size="lg"
            className={
              isSimulating
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-primary hover:bg-primary/90 glow-cyan'
            }
          >
            {isSimulating ? (
              <>
                <StopCircle className="mr-2 h-5 w-5" />
                Stop Simulation
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Simulation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12 bg-muted/50 p-1">
          <TabsTrigger
            value="devices"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <Radio className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger
            value="telemetry"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            disabled={!selectedDeviceId}
          >
            <Activity className="h-4 w-4" />
            Telemetry
            {selectedDeviceId && (
              <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
                1
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <Settings className="h-4 w-4" />
            TTN Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <DeviceManager onSelectDevice={handleDeviceSelect} />
        </TabsContent>

        <TabsContent value="telemetry" className="space-y-4">
          {selectedDeviceId ? (
            <TelemetryChart deviceId={selectedDeviceId} autoRefresh={isSimulating} />
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto h-16 w-16 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">No device selected</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Select a device from the Devices tab to view telemetry
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <WebhookSettings />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="mt-12 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground animate-fade-in-up animate-delay-300">
        <p className="flex items-center justify-center gap-2">
          <span className="font-mono">TTN v3 HTTP API</span>
          <span>•</span>
          <span className="font-mono">Turso Edge Database</span>
          <span>•</span>
          <span className="font-mono">Cloudflare Workers</span>
        </p>
      </div>
    </div>
  )
}
