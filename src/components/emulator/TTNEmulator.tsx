/**
 * TTN Emulator - Matches The Things Network Architecture
 * Organization → Applications → End Devices
 * Organization → Gateways
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Radio, Server } from 'lucide-react'

import { ApplicationsView } from './ttn/ApplicationsView'
import { GatewaysView } from './ttn/GatewaysView'

export function TTNEmulator() {
  const [activeTab, setActiveTab] = useState('applications')

  return (
    <Card>
      <CardHeader>
        <CardTitle>TTN LoRaWAN Network Emulator</CardTitle>
        <CardDescription>
          Manage applications, end devices, and gateways following The Things Network architecture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applications">
              <Radio className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="gateways">
              <Server className="w-4 h-4 mr-2" />
              Gateways
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-6">
            <ApplicationsView />
          </TabsContent>

          <TabsContent value="gateways" className="mt-6">
            <GatewaysView />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
