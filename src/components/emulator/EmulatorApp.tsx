/**
 * EmulatorApp - Main application shell with tab navigation
 * Implements the full UI inventory from the design system
 */

import { useState } from 'react'
import {
  Radio,
  Server,
  Cpu,
  Webhook,
  TestTube,
  Activity,
  FileText,
  Settings,
  RefreshCw,
  Play,
  Square,
  User,
  Loader2,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/ui/status-pill'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isStackAuthConfigured } from '@/lib/stackAuth'
import { useEmulation } from '@/hooks/useEmulation'

// Tab components
import { SensorsTab } from './tabs/SensorsTab'
import { GatewaysTab } from './tabs/GatewaysTab'
import { DevicesTab } from './tabs/DevicesTab'
import { WebhookTab } from './tabs/WebhookTab'
import { TestingTab } from './tabs/TestingTab'
import { MonitorTab } from './tabs/MonitorTab'
import { LogsTab } from './tabs/LogsTab'
import { UserProfile } from '@/components/UserProfile'

export function EmulatorApp() {
  const [activeTab, setActiveTab] = useState('sensors')
  const [selectedOrg, setSelectedOrg] = useState('default')
  const [isSendingSingle, setIsSendingSingle] = useState(false)

  // Use the emulation hook for all emulation logic
  const {
    status: emulatorStatus,
    readingsCount,
    activeDeviceCount,
    startEmulation,
    stopEmulation,
    sendSingleReading,
  } = useEmulation({ defaultInterval: 30000 })

  const handleStartEmulation = () => {
    startEmulation()
  }

  const handleStopEmulation = () => {
    stopEmulation()
  }

  const handleSingleReading = async () => {
    setIsSendingSingle(true)
    await sendSingleReading()
    setIsSendingSingle(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top App Bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo, Title, Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-lg font-semibold text-foreground">
                  LoRaWAN Device Emulator
                </h1>
              </div>

              {/* Org Selector */}
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Select org" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Org</SelectItem>
                  <SelectItem value="org-1">Organization 1</SelectItem>
                  <SelectItem value="org-2">Organization 2</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                <StatusPill
                  variant={emulatorStatus === 'running' ? 'success' : emulatorStatus === 'error' ? 'error' : 'neutral'}
                  pulse={emulatorStatus === 'running'}
                >
                  {emulatorStatus === 'running' ? 'Running' : emulatorStatus === 'error' ? 'Error' : 'Stopped'}
                </StatusPill>
                <StatusPill
                  variant={activeDeviceCount > 0 ? 'info' : 'warning'}
                  dot={false}
                >
                  {activeDeviceCount} device{activeDeviceCount !== 1 ? 's' : ''}
                </StatusPill>
                {readingsCount > 0 && (
                  <StatusPill variant="info" dot={false}>
                    {readingsCount} readings
                  </StatusPill>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {emulatorStatus === 'running' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopEmulation}
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartEmulation}
                  disabled={activeDeviceCount === 0}
                  title={activeDeviceCount === 0 ? 'Add active devices to start emulation' : undefined}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start Emulation
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSingleReading}
                disabled={isSendingSingle || activeDeviceCount === 0}
              >
                {isSendingSingle && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Single Reading
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
              {isStackAuthConfigured ? (
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

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="sensors" className="gap-1.5">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Sensors</span>
            </TabsTrigger>
            <TabsTrigger value="gateways" className="gap-1.5">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">Gateways</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="webhook" className="gap-1.5">
              <Webhook className="w-4 h-4" />
              <span className="hidden sm:inline">Webhook</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="gap-1.5">
              <TestTube className="w-4 h-4" />
              <span className="hidden sm:inline">Testing</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="gap-1.5">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="sensors">
            <SensorsTab />
          </TabsContent>
          <TabsContent value="gateways">
            <GatewaysTab />
          </TabsContent>
          <TabsContent value="devices">
            <DevicesTab />
          </TabsContent>
          <TabsContent value="webhook">
            <WebhookTab />
          </TabsContent>
          <TabsContent value="testing">
            <TestingTab />
          </TabsContent>
          <TabsContent value="monitor">
            <MonitorTab />
          </TabsContent>
          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
