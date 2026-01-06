/**
 * LogsTab - Live log feed and debugging
 * Connected to emulation system for real readings
 * Uses global logsStore for persistence across tab switches
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
  Loader2,
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
import { useEmulation } from '@/hooks/useEmulation'
import { useToast } from '@/hooks/use-toast'
import { useLogs, LogEntry } from '@/hooks/useLogs'

type LogLevel = 'info' | 'warning' | 'error' | 'success' | 'debug'

export function LogsTab() {
  const { toast } = useToast()
  const { sendSingleReading, activeDeviceCount } = useEmulation({})

  // Use global logs store - persists across tab switches
  const {
    logs,
    isLogging,
    startLogging,
    stopLogging,
    toggleLogging,
    addLog,
    addLogs,
    clearLogs,
  } = useLogs()

  const [isSendingReading, setIsSendingReading] = useState(false)
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

  const handleEnableLogging = () => {
    startLogging()
  }

  const handleRunSingleReading = async () => {
    if (activeDeviceCount === 0) {
      toast({
        title: 'No active devices',
        description: 'Add and activate devices before sending readings.',
        variant: 'destructive',
      })
      return
    }

    setIsSendingReading(true)

    // Add log entry for trigger
    addLog({
      level: 'info',
      source: 'emulator',
      message: 'Manual reading triggered',
      details: `Sending to ${activeDeviceCount} active device(s)`,
    })

    try {
      await sendSingleReading()

      // Add success logs
      addLogs([
        {
          level: 'info',
          source: 'emulator',
          message: 'Capturing sensor data...',
          details: 'Temperature: 38.5°F, Humidity: 62%, Door: Closed',
        },
        {
          level: 'success',
          source: 'ttn',
          message: 'Uplink sent successfully',
          details: 'Reading transmitted via TTN simulation API',
        },
      ])

      toast({
        title: 'Reading sent',
        description: 'Single reading transmitted successfully.',
      })
    } catch (err) {
      addLog({
        level: 'error',
        source: 'ttn',
        message: 'Failed to send reading',
        details: err instanceof Error ? err.message : 'Unknown error',
      })

      toast({
        title: 'Failed to send reading',
        description: 'Check TTN configuration and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSendingReading(false)
    }
  }

  const handleClearLogs = () => {
    clearLogs()
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
    if (!levelFilters.includes(log.level as LogLevel)) return false
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

  // Show empty state only if logging is disabled AND no logs exist
  // If logs exist from a previous session, show them even if logging is paused
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
                onClick={toggleLogging}
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunSingleReading}
                disabled={isSendingReading || activeDeviceCount === 0}
              >
                {isSendingReading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-1" />
                )}
                {isSendingReading ? 'Sending...' : 'Run Single Reading'}
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
                    <LogIcon level={log.level as LogLevel} />
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
