/**
 * SetupWizard - Multi-step guided setup flow
 * Shows contextual steps to help users complete required configuration
 */

import { useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card'
import { Button } from './button'
import { Progress } from './progress'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Rocket,
  SkipForward,
} from 'lucide-react'

export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped'

export interface WizardStep {
  id: string
  title: string
  description?: string
  isOptional?: boolean
  isCompleted?: boolean
  content: ReactNode
}

interface SetupWizardProps {
  title: string
  description?: string
  steps: WizardStep[]
  onComplete?: () => void
  className?: string
}

export function SetupWizard({
  title,
  description,
  steps,
  onComplete,
  className,
}: SetupWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set())
  const [expandedStep, setExpandedStep] = useState<string | null>(steps[0]?.id || null)

  const getStepStatus = useCallback(
    (step: WizardStep, index: number): StepStatus => {
      if (completedSteps.has(step.id) || step.isCompleted) return 'completed'
      if (skippedSteps.has(step.id)) return 'skipped'
      if (index === currentStepIndex) return 'active'
      return 'pending'
    },
    [completedSteps, skippedSteps, currentStepIndex]
  )

  const handleStepComplete = useCallback(
    (stepId: string) => {
      setCompletedSteps((prev) => new Set([...prev, stepId]))

      // Find next incomplete step
      const currentIndex = steps.findIndex((s) => s.id === stepId)
      const nextIncomplete = steps.findIndex(
        (s, i) =>
          i > currentIndex &&
          !completedSteps.has(s.id) &&
          !skippedSteps.has(s.id) &&
          !s.isCompleted
      )

      if (nextIncomplete !== -1) {
        setCurrentStepIndex(nextIncomplete)
        setExpandedStep(steps[nextIncomplete].id)
      } else {
        // All steps complete
        setExpandedStep(null)
        onComplete?.()
      }
    },
    [steps, completedSteps, skippedSteps, onComplete]
  )

  const handleSkipStep = useCallback(
    (stepId: string) => {
      const step = steps.find((s) => s.id === stepId)
      if (!step?.isOptional) return

      setSkippedSteps((prev) => new Set([...prev, stepId]))

      // Move to next step
      const currentIndex = steps.findIndex((s) => s.id === stepId)
      const nextIncomplete = steps.findIndex(
        (s, i) =>
          i > currentIndex &&
          !completedSteps.has(s.id) &&
          !skippedSteps.has(s.id) &&
          !s.isCompleted
      )

      if (nextIncomplete !== -1) {
        setCurrentStepIndex(nextIncomplete)
        setExpandedStep(steps[nextIncomplete].id)
      } else {
        setExpandedStep(null)
        onComplete?.()
      }
    },
    [steps, completedSteps, skippedSteps, onComplete]
  )

  const toggleStepExpanded = useCallback((stepId: string) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId))
  }, [])

  // Calculate progress
  const completedCount = steps.filter(
    (s) => completedSteps.has(s.id) || skippedSteps.has(s.id) || s.isCompleted
  ).length
  const progressPercent = (completedCount / steps.length) * 100

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>
              {completedCount} of {steps.length} complete
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-2 pt-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step, index)
            const isExpanded = expandedStep === step.id

            return (
              <div
                key={step.id}
                className={cn(
                  'border rounded-lg transition-colors',
                  status === 'active' && 'border-primary bg-primary/5',
                  status === 'completed' && 'border-green-500/30 bg-green-500/5',
                  status === 'skipped' && 'border-muted bg-muted/30',
                  status === 'pending' && 'border-border'
                )}
              >
                {/* Step header */}
                <button
                  onClick={() => toggleStepExpanded(step.id)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                  disabled={status === 'pending' && index > currentStepIndex}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : status === 'active' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">
                          {index + 1}
                        </span>
                      </div>
                    ) : status === 'skipped' ? (
                      <SkipForward className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Step info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-medium',
                          status === 'completed' && 'text-green-600',
                          status === 'skipped' && 'text-muted-foreground line-through'
                        )}
                      >
                        {step.title}
                      </span>
                      {step.isOptional && (
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {step.description}
                      </p>
                    )}
                  </div>

                  {/* Expand/collapse */}
                  {status !== 'pending' && (
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </button>

                {/* Step content */}
                {isExpanded && status !== 'pending' && (
                  <div className="px-3 pb-3 pt-0">
                    <div className="ml-8 pl-3 border-l-2 border-primary/20">
                      <WizardStepContent
                        step={step}
                        status={status}
                        onComplete={() => handleStepComplete(step.id)}
                        onSkip={step.isOptional ? () => handleSkipStep(step.id) : undefined}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface WizardStepContentProps {
  step: WizardStep
  status: StepStatus
  onComplete: () => void
  onSkip?: () => void
}

function WizardStepContent({ step, status, onComplete, onSkip }: WizardStepContentProps) {
  if (status === 'completed') {
    return (
      <div className="py-2 text-sm text-green-600 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        Completed
      </div>
    )
  }

  if (status === 'skipped') {
    return (
      <div className="py-2 text-sm text-muted-foreground flex items-center gap-2">
        <SkipForward className="w-4 h-4" />
        Skipped
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      {step.content}
      {onSkip && (
        <Button variant="ghost" size="sm" onClick={onSkip}>
          <SkipForward className="w-4 h-4 mr-1" />
          Skip this step
        </Button>
      )}
    </div>
  )
}

// Export a context for step forms to signal completion
import { createContext, useContext } from 'react'

interface WizardStepContextValue {
  onComplete: () => void
}

export const WizardStepContext = createContext<WizardStepContextValue | null>(null)

export function useWizardStep() {
  const context = useContext(WizardStepContext)
  if (!context) {
    throw new Error('useWizardStep must be used within a WizardStepContext')
  }
  return context
}
