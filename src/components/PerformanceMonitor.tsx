/**
 * Performance Monitoring Component
 * Tracks Core Web Vitals and performance metrics
 */

import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { setPerformanceMetrics } from '@/store/slices/uiSlice'

// Import web-vitals functions
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface PerformanceEntry {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  id?: string
}

export function PerformanceMonitor() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Track Core Web Vitals
    const handlePerformanceEntry = (entry: PerformanceEntry) => {
      // Log to console in development
      if (import.meta.env.DEV) {
        console.log(`Performance: ${entry.name}`, {
          value: entry.value,
          rating: entry.rating,
          delta: entry.delta,
        })
      }

      // Update Redux store
      dispatch(setPerformanceMetrics({
        [entry.name]: entry.value,
      }))

      // In production, you would send this to your analytics service
      if (import.meta.env.PROD) {
        sendToAnalytics(entry)
      }
    }

    // Initialize Core Web Vitals tracking
    getCLS(handlePerformanceEntry)
    getFID(handlePerformanceEntry)
    getFCP(handlePerformanceEntry)
    getLCP(handlePerformanceEntry)
    getTTFB(handlePerformanceEntry)

    // Track custom performance metrics
    trackCustomMetrics()

    // Track memory usage if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      dispatch(setPerformanceMetrics({
        memoryUsage: memoryInfo.usedJSHeapSize,
      }))
    }

    // Track bundle size (approximate)
    trackBundleSize()

  }, [dispatch])

  return null // This component doesn't render anything
}

function trackCustomMetrics() {
  // Track time to interactive
  if ('performance' in window && 'mark' in performance) {
    // Mark when React has finished initial render
    performance.mark('react-app-interactive')

    window.addEventListener('load', () => {
      performance.measure(
        'time-to-interactive',
        'navigationStart',
        'react-app-interactive'
      )

      const measure = performance.getEntriesByName('time-to-interactive')[0]
      if (measure) {
        const rating = measure.duration < 3000 ? 'good' : 
                      measure.duration < 5000 ? 'needs-improvement' : 'poor'
        
        const entry: PerformanceEntry = {
          name: 'time-to-interactive',
          value: measure.duration,
          rating,
        }

        if (import.meta.env.DEV) {
          console.log('Time to Interactive:', measure.duration)
        }

        if (import.meta.env.PROD) {
          sendToAnalytics(entry)
        }
      }
    })
  }
}

function trackBundleSize() {
  // Estimate bundle size from network requests
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      
      let totalJSSize = 0
      let totalCSSSize = 0

      resources.forEach(resource => {
        if (resource.name.includes('.js')) {
          totalJSSize += resource.transferSize || resource.encodedBodySize || 0
        } else if (resource.name.includes('.css')) {
          totalCSSSize += resource.transferSize || resource.encodedBodySize || 0
        }
      })

      const bundleSize = totalJSSize + totalCSSSize

      if (import.meta.env.DEV) {
        console.log('Bundle Size Estimate:', {
          total: bundleSize,
          js: totalJSSize,
          css: totalCSSSize,
        })
      }

      if (import.meta.env.PROD) {
        sendToAnalytics({
          name: 'bundle-size',
          value: bundleSize,
          rating: bundleSize < 300000 ? 'good' : bundleSize < 500000 ? 'needs-improvement' : 'poor',
        })
      }
    })
  }
}

async function sendToAnalytics(metric: PerformanceEntry) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    })

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/performance', body)
    } else {
      // Fallback to fetch
      fetch('/api/analytics/performance', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
      }).catch(error => {
        console.warn('Failed to send performance metrics:', error)
      })
    }
  } catch (error) {
    console.warn('Failed to send analytics:', error)
  }
}

// Hook for manual performance tracking
export function usePerformanceTracking() {
  const dispatch = useAppDispatch()

  return {
    startMark: (name: string) => {
      if ('performance' in window && 'mark' in performance) {
        performance.mark(`${name}-start`)
      }
    },

    endMark: (name: string) => {
      if ('performance' in window && 'mark' in performance && 'measure' in performance) {
        performance.mark(`${name}-end`)
        performance.measure(name, `${name}-start`, `${name}-end`)
        
        const measure = performance.getEntriesByName(name)[0]
        if (measure) {
          dispatch(setPerformanceMetrics({
            [name]: measure.duration,
          }))

          if (import.meta.env.DEV) {
            console.log(`Performance: ${name}`, measure.duration)
          }
        }
      }
    },

    trackUserInteraction: (interaction: string, duration: number) => {
      dispatch(setPerformanceMetrics({
        [`interaction-${interaction}`]: duration,
      }))

      if (import.meta.env.PROD) {
        sendToAnalytics({
          name: `interaction-${interaction}`,
          value: duration,
          rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
        })
      }
    },

    trackRenderTime: (componentName: string, renderTime: number) => {
      dispatch(setPerformanceMetrics({
        [`render-${componentName}`]: renderTime,
      }))

      if (import.meta.env.DEV) {
        console.log(`Render: ${componentName}`, renderTime)
      }
    },
  }
}