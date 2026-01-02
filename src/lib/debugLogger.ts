/**
 * Debug Logger Utility
 * Provides consistent logging for debugging throughout the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  event: string
  data?: any
}

class DebugLogger {
  private enabled: boolean = import.meta.env.DEV

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private log(level: LogLevel, event: string, data?: any) {
    if (!this.enabled) return

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      event,
      data,
    }

    const style = this.getStyle(level)
    const message = `[${entry.timestamp}] ${event}`

    switch (level) {
      case 'error':
        console.error(`%c${message}`, style, data || '')
        break
      case 'warn':
        console.warn(`%c${message}`, style, data || '')
        break
      case 'debug':
        console.debug(`%c${message}`, style, data || '')
        break
      default:
        console.log(`%c${message}`, style, data || '')
    }
  }

  private getStyle(level: LogLevel): string {
    const styles = {
      info: 'color: #3b82f6; font-weight: bold',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
      debug: 'color: #8b5cf6; font-weight: bold',
    }
    return styles[level]
  }

  info(event: string, data?: any) {
    this.log('info', event, data)
  }

  warn(event: string, data?: any) {
    this.log('warn', event, data)
  }

  error(event: string, data?: any) {
    this.log('error', event, data)
  }

  debug(event: string, data?: any) {
    this.log('debug', event, data)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
}

export const debugLogger = new DebugLogger()
