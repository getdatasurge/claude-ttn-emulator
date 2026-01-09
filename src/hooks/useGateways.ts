/**
 * React Query hooks for TTN Gateways management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface Gateway {
  id: string
  organization_id: string
  gateway_eui: string
  gateway_id: string
  name: string
  description: string
  frequency_plan: string
  status: 'active' | 'inactive'
  created_at: number
  updated_at: number
}

export interface CreateGatewayInput {
  gateway_eui: string
  gateway_id: string
  name: string
  description?: string
  frequency_plan?: string
  status?: 'active' | 'inactive'
}

export interface UpdateGatewayInput {
  name?: string
  description?: string
  status?: 'active' | 'inactive'
}

const GATEWAYS_QUERY_KEY = ['gateways']

// Fetch all gateways
export function useGateways() {
  return useQuery({
    queryKey: GATEWAYS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<Gateway[]>('/api/gateways')
      return response
    },
    // Disable retries - show errors immediately for better UX
    retry: false,
  })
}

// Create gateway
export function useCreateGateway() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGatewayInput) => {
      const response = await apiClient.post<Gateway>('/api/gateways', input)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GATEWAYS_QUERY_KEY })
    },
  })
}

// Update gateway
export function useUpdateGateway() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateGatewayInput }) => {
      const response = await apiClient.put<Gateway>(`/api/gateways/${id}`, updates)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GATEWAYS_QUERY_KEY })
    },
  })
}

// Delete gateway
export function useDeleteGateway() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (gatewayId: string) => {
      await apiClient.delete(`/api/gateways/${gatewayId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GATEWAYS_QUERY_KEY })
    },
  })
}

// Generate gateway EUI
export function generateGatewayEUI(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

// Frequency plans
export const FREQUENCY_PLANS = [
  { value: 'US_902_928', label: 'US 902-928 MHz' },
  { value: 'EU_863_870', label: 'EU 863-870 MHz' },
  { value: 'AS_923', label: 'AS 923 MHz' },
  { value: 'AU_915_928', label: 'AU 915-928 MHz' },
  { value: 'CN_470_510', label: 'CN 470-510 MHz' },
  { value: 'IN_865_867', label: 'IN 865-867 MHz' },
  { value: 'KR_920_923', label: 'KR 920-923 MHz' },
  { value: 'RU_864_870', label: 'RU 864-870 MHz' },
]
