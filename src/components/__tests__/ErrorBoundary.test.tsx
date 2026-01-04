/**
 * Error Boundary Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorFallback, ComponentErrorBoundary } from '../ErrorBoundary'

// Mock console.error to avoid noise in tests
const originalError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message')
  const mockResetErrorBoundary = vi.fn()

  beforeEach(() => {
    mockResetErrorBoundary.mockClear()
  })

  it('should display error message', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/The application encountered an unexpected error/)).toBeInTheDocument()
  })

  it('should have retry button that calls resetErrorBoundary', async () => {
    const user = userEvent.setup()
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)

    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1)
  })

  it('should have go home button', async () => {
    // Mock window.location
    delete (window as any).location
    window.location = { href: '' } as any

    const user = userEvent.setup()
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    const homeButton = screen.getByRole('button', { name: /go home/i })
    await user.click(homeButton)

    expect(window.location.href).toBe('/')
  })

  it('should show technical details when requested', async () => {
    const user = userEvent.setup()
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    // Details should be hidden initially
    expect(screen.queryByText('Test error message')).not.toBeInTheDocument()

    // Click to show details
    const showDetailsButton = screen.getByRole('button', { name: /show technical details/i })
    await user.click(showDetailsButton)

    // Details should now be visible
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByText('Stack Trace:')).toBeInTheDocument()
  })

  it('should handle error reporting', async () => {
    const user = userEvent.setup()
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    const reportButton = screen.getByRole('button', { name: /send error report/i })
    await user.click(reportButton)

    // Should show success message after reporting
    expect(await screen.findByText(/error report sent successfully/i)).toBeInTheDocument()
  })
})

describe('ComponentErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Component error')
    }
    return <div>No error</div>
  }

  const mockOnError = vi.fn()

  beforeEach(() => {
    mockOnError.mockClear()
  })

  it('should render children when no error', () => {
    render(
      <ComponentErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={false} />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should catch and display component errors', () => {
    render(
      <ComponentErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText(/failed to load component/i)).toBeInTheDocument()
    expect(screen.getByText(/component error/i)).toBeInTheDocument()
    expect(mockOnError).toHaveBeenCalledTimes(1)
  })

  it('should have retry functionality', async () => {
    const user = userEvent.setup()

    // Use a ref-like pattern so the value can be changed before retry renders
    const throwState = { shouldThrow: true }

    const ConditionalThrow = () => {
      if (throwState.shouldThrow) {
        throw new Error('Component error')
      }
      return <div>No error</div>
    }

    render(
      <ComponentErrorBoundary onError={mockOnError}>
        <ConditionalThrow />
      </ComponentErrorBoundary>
    )

    // Error should be displayed
    expect(screen.getByText(/failed to load component/i)).toBeInTheDocument()

    // Fix the component BEFORE clicking retry
    throwState.shouldThrow = false

    // Click retry - now when the boundary re-renders children, they won't throw
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)

    // Should show the working component
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should use custom fallback component', () => {
    const CustomFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    )

    render(
      <ComponentErrorBoundary fallback={CustomFallback} onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('Custom error: Component error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument()
  })
})