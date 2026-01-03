/**
 * SensorsTab - Sensor configuration and test scenarios
 */

import { useState } from 'react'
import {
  Thermometer,
  Droplets,
  DoorOpen,
  Snowflake,
  ThermometerSun,
  Battery,
  Wifi,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusPill } from '@/components/ui/status-pill'

interface SensorConfig {
  tempMin: number
  tempMax: number
  humidity: number
  readingInterval: string
  doorState: 'open' | 'closed'
  doorEnabled: boolean
  tempEnabled: boolean
}

const defaultConfig: SensorConfig = {
  tempMin: 35,
  tempMax: 45,
  humidity: 65,
  readingInterval: '5m',
  doorState: 'closed',
  doorEnabled: true,
  tempEnabled: true,
}

const testScenarios = [
  {
    id: 'normal-freezer',
    name: 'Normal Freezer',
    icon: Snowflake,
    type: 'Temperature',
    range: '-10°F to 0°F',
    config: { tempMin: -10, tempMax: 0, humidity: 60 },
  },
  {
    id: 'normal-fridge',
    name: 'Normal Refrigerator',
    icon: Thermometer,
    type: 'Temperature',
    range: '35°F to 40°F',
    config: { tempMin: 35, tempMax: 40, humidity: 65 },
  },
  {
    id: 'temp-excursion',
    name: 'Temp Excursion',
    icon: ThermometerSun,
    type: 'Alert',
    range: '50°F+ (Warning)',
    config: { tempMin: 50, tempMax: 65, humidity: 70 },
  },
  {
    id: 'door-open',
    name: 'Door Left Open',
    icon: DoorOpen,
    type: 'Alert',
    range: 'Door open 5+ min',
    config: { doorState: 'open' as const },
  },
  {
    id: 'low-battery',
    name: 'Low Battery',
    icon: Battery,
    type: 'Warning',
    range: '< 20% battery',
    config: {},
  },
  {
    id: 'poor-signal',
    name: 'Poor Signal',
    icon: Wifi,
    type: 'Warning',
    range: 'RSSI < -110 dBm',
    config: {},
  },
]

export function SensorsTab() {
  const [config, setConfig] = useState<SensorConfig>(defaultConfig)

  const handleTempRangeChange = (values: number[]) => {
    setConfig((prev) => ({
      ...prev,
      tempMin: values[0],
      tempMax: values[1],
    }))
  }

  const handleHumidityChange = (values: number[]) => {
    setConfig((prev) => ({
      ...prev,
      humidity: values[0],
    }))
  }

  const applyScenario = (scenario: typeof testScenarios[0]) => {
    setConfig((prev) => ({
      ...prev,
      ...scenario.config,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Sensor Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Sensor Card */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-primary" />
                Temperature Sensor
              </CardTitle>
              <Switch
                checked={config.tempEnabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, tempEnabled: checked }))
                }
              />
            </div>
            <CardDescription>
              Configure temperature range and humidity settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Temperature Range</Label>
                <span className="text-sm text-muted-foreground">
                  {config.tempMin}°F - {config.tempMax}°F
                </span>
              </div>
              <Slider
                value={[config.tempMin, config.tempMax]}
                onValueChange={handleTempRangeChange}
                min={-40}
                max={100}
                step={1}
                disabled={!config.tempEnabled}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Min (°F)</Label>
                  <Input
                    type="number"
                    value={config.tempMin}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        tempMin: parseInt(e.target.value) || 0,
                      }))
                    }
                    disabled={!config.tempEnabled}
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Max (°F)</Label>
                  <Input
                    type="number"
                    value={config.tempMax}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        tempMax: parseInt(e.target.value) || 0,
                      }))
                    }
                    disabled={!config.tempEnabled}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* Humidity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Humidity
                </Label>
                <span className="text-sm text-muted-foreground">
                  {config.humidity}%
                </span>
              </div>
              <Slider
                value={[config.humidity]}
                onValueChange={handleHumidityChange}
                min={0}
                max={100}
                step={1}
                disabled={!config.tempEnabled}
              />
            </div>

            {/* Reading Interval */}
            <div className="space-y-2">
              <Label>Reading Interval</Label>
              <Select
                value={config.readingInterval}
                onValueChange={(value) =>
                  setConfig((prev) => ({ ...prev, readingInterval: value }))
                }
                disabled={!config.tempEnabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Every 1 minute</SelectItem>
                  <SelectItem value="5m">Every 5 minutes</SelectItem>
                  <SelectItem value="15m">Every 15 minutes</SelectItem>
                  <SelectItem value="30m">Every 30 minutes</SelectItem>
                  <SelectItem value="1h">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Door Sensor Card */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-primary" />
                Door Sensor
              </CardTitle>
              <Switch
                checked={config.doorEnabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, doorEnabled: checked }))
                }
              />
            </div>
            <CardDescription>
              Configure door state and monitoring interval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current State */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    config.doorState === 'closed'
                      ? 'bg-primary/20'
                      : 'bg-amber-500/20'
                  }`}
                >
                  <DoorOpen
                    className={`w-6 h-6 ${
                      config.doorState === 'closed'
                        ? 'text-primary'
                        : 'text-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <div
                    className={`text-xl font-bold ${
                      config.doorState === 'closed'
                        ? 'text-primary'
                        : 'text-amber-500'
                    }`}
                  >
                    {config.doorState.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current door state
                  </div>
                </div>
              </div>
              <StatusPill
                variant={config.doorState === 'closed' ? 'success' : 'warning'}
              >
                {config.doorState === 'closed' ? 'Secure' : 'Alert'}
              </StatusPill>
            </div>

            {/* Toggle Door Button */}
            <Button
              variant={config.doorState === 'closed' ? 'outline' : 'default'}
              className="w-full"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  doorState: prev.doorState === 'closed' ? 'open' : 'closed',
                }))
              }
              disabled={!config.doorEnabled}
            >
              {config.doorState === 'closed' ? 'Open Door' : 'Close Door'}
            </Button>

            {/* Status Interval */}
            <div className="space-y-2">
              <Label>Status Interval</Label>
              <Select defaultValue="30s" disabled={!config.doorEnabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10s">Every 10 seconds</SelectItem>
                  <SelectItem value="30s">Every 30 seconds</SelectItem>
                  <SelectItem value="1m">Every 1 minute</SelectItem>
                  <SelectItem value="5m">Every 5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Scenarios Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Test Scenarios</h2>
        <p className="text-sm text-muted-foreground">
          Quick presets to simulate common sensor conditions
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {testScenarios.map((scenario) => {
            const Icon = scenario.icon
            return (
              <Card
                key={scenario.id}
                className="dashboard-card cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => applyScenario(scenario)}
              >
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-2">
                    <Icon
                      className={`w-5 h-5 ${
                        scenario.type === 'Alert'
                          ? 'text-amber-500'
                          : scenario.type === 'Warning'
                          ? 'text-orange-500'
                          : 'text-primary'
                      }`}
                    />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    {scenario.name}
                  </h3>
                  <StatusPill
                    variant={
                      scenario.type === 'Alert'
                        ? 'warning'
                        : scenario.type === 'Warning'
                        ? 'error'
                        : 'info'
                    }
                    size="sm"
                    dot={false}
                  >
                    {scenario.type}
                  </StatusPill>
                  <p className="text-xs text-muted-foreground mt-2">
                    {scenario.range}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
