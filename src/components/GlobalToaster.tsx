/**
 * Global Toast System
 * Integrates Redux UI state with toast notifications
 */

import React, { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectToasts, removeToast } from '@/store/slices/uiSlice'
import { Toast } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'

export function GlobalToaster() {
  const toasts = useAppSelector(selectToasts)
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  useEffect(() => {
    // Process Redux toasts and show them using the shadcn toast system
    toasts.forEach(toastData => {
      // Avoid showing the same toast multiple times
      const toastId = `redux-toast-${toastData.id}`
      
      toast({
        title: toastData.title,
        description: toastData.description,
        variant: toastData.type === 'error' ? 'destructive' : 'default',
        action: toastData.action ? {
          label: toastData.action.label,
          onClick: toastData.action.onClick,
        } : undefined,
        duration: toastData.duration || (toastData.type === 'error' ? 10000 : 5000),
      })

      // Remove from Redux store after showing
      dispatch(removeToast(toastData.id))
    })
  }, [toasts, toast, dispatch])

  // The actual toast rendering is handled by shadcn's Toaster component
  // which should be included in the main App component
  return null
}

// Hook for adding toasts from components
export function useAppToast() {
  const dispatch = useAppDispatch()

  return {
    success: (title: string, description?: string) => {
      dispatch({
        type: 'ui/addToast',
        payload: {
          title,
          description,
          type: 'success' as const,
        },
      })
    },
    
    error: (title: string, description?: string) => {
      dispatch({
        type: 'ui/addToast',
        payload: {
          title,
          description,
          type: 'error' as const,
          duration: 10000,
        },
      })
    },
    
    warning: (title: string, description?: string) => {
      dispatch({
        type: 'ui/addToast',
        payload: {
          title,
          description,
          type: 'warning' as const,
        },
      })
    },
    
    info: (title: string, description?: string) => {
      dispatch({
        type: 'ui/addToast',
        payload: {
          title,
          description,
          type: 'info' as const,
        },
      })
    },
    
    custom: (toast: {
      title: string
      description?: string
      type: 'success' | 'error' | 'warning' | 'info'
      duration?: number
      action?: {
        label: string
        onClick: () => void
      }
    }) => {
      dispatch({
        type: 'ui/addToast',
        payload: toast,
      })
    },
  }
}