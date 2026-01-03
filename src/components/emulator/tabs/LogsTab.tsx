/**
 * LogsTab - Live log feed and debugging
 */

import { useState, useEffect, useRef } from 'react'
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Radio,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { StatusPill } from '@/components/ui/status-pill'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type LogLevel = 'info' | 'warning' | 'error' | 'success' | 'debug'

interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  source: 'emulator' | 'ttn' | 'webhook' | 'database' | 'system'
  message: string
  details?: string
}

const generateLogEntry = (): LogEntry => {
  const messages = [
    { level: 'info', source: 'emulator', message: 'Sending uplink message', details: 'DevEUI: 70B3D57ED0000001, Port: 1, Payload: 0x48656C6C6F' },
    { level: 'success', source: 'ttn', message: 'Uplink accepted by TTN', details: 'Message ID: abc123, Gateway: US Gateway' },
    { level: 'info', source: 'webhook', message: 'Webhook delivered successfully', details: 'Status: 200, Latency: 145ms' },
    { level: 'success', source: 'database', message: 'Telemetry record inserted', details: 'Table: telemetry_readings, ID: 12345' },
    { level: 'warning', source: 'emulator', message: 'Low battery detected on device', details: 'DevEUI: 70B3D57ED0000002, Battery: 15%' },
    { level: 'error', source: 'ttn', message: 'Failed to send downlink', details: 'Error: Device not in receive window' },
    { level: 'debug', source: 'system', message: 'Configuration loaded', details: 'TTN Host: nam1.cloud.thethings.network' },
    { level: 'info', source: 'emulator', message: 'Temperature reading captured', details: 'Value: 38.5°F, Humidity: 62%' },
    { level: 'warning', source: 'webhook', message: 'Webhook retry triggered', details: 'Attempt 2 of 3, Previous error: Timeout' },
    { level: 'success', source: 'ttn', message: 'Join accept received', details: 'DevEUI: 70B3D57ED0000001, DevAddr: 26011234' },
  ]

  const msg = messages[Math.floor(Math.random() * messages.length)]

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    level: msg.level as LogLevel,
    source: msg.source as LogEntry['source'],
    message: msg.message,
    details: msg.details,
  }
}

export function LogsTab() {
  const [isLogging, setIsLogging] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState('')
  const [levelFilters, setLevelFilters] = useState<LogLevel[]>(['info', 'warning', 'error', 'success', 'debug'])
  const [sourceFilter, setSourceFilter] = useState('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Simulated log generation
  useEffect(() => {
    if (!isLogging) return

    const interval = setInterval(() => {
      setLogs((prev) => [...prev, generateLogEntry()].slice(-500)) // Keep last 500 logs
    }, 1000 + Math.random() * 2000)

    return () => clearInterval(interval)
  }, [isLogging])

  const handleEnableLogging = () => {
    setIsLogging(true)
    setLogs([
      {
        id: 'start',
        timestamp: new Date(),
        level: 'info',
        source: 'system',
        message: 'Logging enabled',
        details: 'Live log feed started',
      },
    ])
  }

  const handleRunSingleReading = () => {
    const reading: LogEntry[] = [
      {
        id: Date.now().toString() + '-1',
        timestamp: new Date(),
        level: 'info',
        source: 'emulator',
        message: 'Manual reading triggered',
      },
      {
        id: Date.now().toString() + '-2',
        timestamp: new Date(),
        level: 'info',
        source: 'emulator',
        message: 'Capturing sensor data...',
        details: 'Temperature: 38.5°F, Humidity: 62%, Door: Closed',
      },
      {
        id: Date.now().toString() + '-3',
        timestamp: new Date(),
        level: 'success',
        source: 'ttn',
        message: 'Uplink sent successfully',
        details: 'DevEUI: 70B3D57ED0000001, FCnt: 1247',
      },
    ]
    setLogs((prev) => [...prev, ...reading])
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  const handleExportLogs = () => {
    const content = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${
            log.details ? ` | ${log.details}` : ''
          }`
      )
      .join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emulator-logs-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredLogs = logs.filter((log) => {
    if (!levelFilters.includes(log.level)) return false
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  const LogIcon = ({ level }: { level: LogLevel }) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-primary" />
      case 'debug':
        return <Terminal className="w-4 h-4 text-muted-foreground" />
    }
  }

  const SourceIcon = ({ source }: { source: LogEntry['source'] }) => {
    switch (source) {
      case 'emulator':
        return <Zap className="w-3 h-3" />
      case 'ttn':
        return <Radio className="w-3 h-3" />
      default:
        return null
    }
  }

  const toggleLevelFilter = (level: LogLevel) => {
    setLevelFilters((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  if (!isLogging && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={Terminal}
          title="Logging is disabled"
          description="Enable logging to capture emulator activity, TTN messages, and webhook events"
          action={{
            label: 'Enable Logging',
            onClick: handleEnableLogging,
          }}
          secondaryAction={{
            label: 'Run Single Reading',
            onClick: handleRunSingleReading,
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Log Controls */}
      <Card className="dashboard-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant={isLogging ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsLogging(!isLogging)}
              >
                {isLogging ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRunSingleReading}>
                <Zap className="w-4 h-4 mr-1" />
                Run Single Reading
              </Button>
              <div className="h-6 w-px bg-border" />
              <StatusPill variant={isLogging ? 'success' : 'neutral'}>
                {isLogging ? 'Live' : 'Paused'}
              </StatusPill>
              <span className="text-sm text-muted-foreground">
                {logs.length} entries
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-scroll" className="text-sm">
                  Auto-scroll
                </Label>
                <Switch
                  id="auto-scroll"
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                />
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearLogs}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportLogs}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Level
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(['info', 'warning', 'error', 'success', 'debug'] as LogLevel[]).map((level) => (
              <DropdownMenuCheckboxItem
                key={level}
                checked={levelFilters.includes(level)}
                onCheckedChange={() => toggleLevelFilter(level)}
              >
                <LogIcon level={level} />
                <span className="ml-2 capitalize">{level}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="emulator">Emulator</SelectItem>
            <SelectItem value="ttn">TTN</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length}
        </span>
      </div>

      {/* Log Feed */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Terminal className="w-4 h-4 text-primary" />
            Log Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={logContainerRef}
            className="h-[60vh] overflow-y-auto font-mono text-sm bg-muted/20 rounded-lg p-2 space-y-1"
          >
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No logs match your filters
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`group p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer ${
                    expandedLog === log.id ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-2">
                    <LogIcon level={log.level} />
                    <span className="text-muted-foreground text-xs w-20 flex-shrink-0">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <StatusPill
                      variant={
                        log.source === 'emulator'
                          ? 'info'
                          : log.source === 'ttn'
                          ? 'success'
                          : log.source === 'webhook'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                      dot={false}
                    >
                      <SourceIcon source={log.source} />
                      <span className="ml-1">{log.source}</span>
                    </StatusPill>
                    <span className="flex-1 text-foreground">{log.message}</span>
                    {log.details && (
                      <span className="text-muted-foreground opacity-0 group-hover:opacity-100">
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    )}
                  </div>
                  {expandedLog === log.id && log.details && (
                    <div className="mt-2 ml-6 pl-4 border-l-2 border-primary/30 text-muted-foreground text-xs">
                      {log.details}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
