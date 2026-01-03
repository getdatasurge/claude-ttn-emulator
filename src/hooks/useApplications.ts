/**
 * React Query hooks for TTN Applications management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface Application {
  id: string
  organization_id: string
  app_id: string
  name: string
  description: string
  created_at: number
  updated_at: number
}

export interface CreateApplicationInput {
  app_id: string
  name: string
  description?: string
}

export interface UpdateApplicationInput {
  name?: string
  description?: string
}

const APPLICATIONS_QUERY_KEY = ['applications']

// Fetch all applications
export function useApplications() {
  return useQuery({
    queryKey: APPLICATIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Application[]>('/api/applications')
      return response
    },
  })
}

// Create application
export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const response = await apiClient.post<Application>('/api/applications', input)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY })
    },
  })
}

// Update application
export function useUpdateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateApplicationInput }) => {
      const response = await apiClient.put<Application>(`/api/applications/${id}`, updates)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY })
    },
  })
}

// Delete application
export function useDeleteApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (applicationId: string) => {
      await apiClient.delete(`/api/applications/${applicationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_QUERY_KEY })
    },
  })
}
