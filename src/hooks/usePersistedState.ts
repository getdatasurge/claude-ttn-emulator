/**
 * usePersistedState - A hook that persists state to localStorage
 * Treats localStorage as the source of truth to survive component remounts
 */

import { useState, useCallback, useEffect, useRef } from 'react'

type Serializer<T> = (value: T) => string
type Deserializer<T> = (value: string) => T

interface UsePersistedStateOptions<T> {
  serializer?: Serializer<T>
  deserializer?: Deserializer<T>
}

const defaultSerializer = <T>(value: T): string => JSON.stringify(value)
const defaultDeserializer = <T>(value: string): T => JSON.parse(value)

export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: UsePersistedStateOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const serializer = options?.serializer ?? defaultSerializer
  const deserializer = options?.deserializer ?? defaultDeserializer

  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true)

  // Read from localStorage on every render to stay in sync
  const getStoredValue = useCallback((): T => {
    try {
      const item = localStorage.getItem(key)
      if (item !== null) {
        return deserializer(item)
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
    return initialValue
  }, [key, initialValue, deserializer])

  // Initialize state from localStorage
  const [state, setState] = useState<T>(getStoredValue)

  // Sync state with localStorage on mount and when key changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      // Re-read from localStorage to ensure we have the latest value
      const storedValue = getStoredValue()
      setState(storedValue)
    }
  }, [getStoredValue])

  // Custom setter that persists to localStorage immediately
  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prevState) => {
        const newValue = typeof value === 'function'
          ? (value as (prev: T) => T)(prevState)
          : value

        // Persist to localStorage synchronously
        try {
          localStorage.setItem(key, serializer(newValue))
        } catch (error) {
          console.warn(`Error writing to localStorage key "${key}":`, error)
        }

        return newValue
      })
    },
    [key, serializer]
  )

  // Clear function to remove from localStorage
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
    setState(initialValue)
  }, [key, initialValue])

  return [state, setPersistedState, clearPersistedState]
}
