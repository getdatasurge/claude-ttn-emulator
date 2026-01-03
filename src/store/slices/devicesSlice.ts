/**
 * Device Management State
 * Handles CRUD operations and real-time telemetry updates
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  getTelemetry,
  simulateTTNUplink,
} from '@/lib/api'
import type { Device, DeviceInsert, DeviceUpdate, Telemetry, DeviceType } from '@/lib/types'

export interface DeviceSimulation {
  isActive: boolean
  interval: number
  lastSimulated: number | null
}

export interface DevicesState {
  // Device data
  devices: Device[]
  selectedDevice: Device | null
  
  // Telemetry data (organized by device ID)
  telemetryData: Record<string, Telemetry[]>
  
  // Device simulation states
  simulations: Record<string, DeviceSimulation>
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isLoadingTelemetry: boolean
  isSimulating: boolean
  
  // Error states
  error: string | null
  telemetryError: string | null
  simulationError: string | null
  
  // UI state
  filters: {
    deviceType: DeviceType | 'all'
    status: 'active' | 'inactive' | 'error' | 'all'
    search: string
  }
  sortBy: 'name' | 'created_at' | 'device_type' | 'status'
  sortOrder: 'asc' | 'desc'
  
  // Pagination for large datasets
  pagination: {
    page: number
    limit: number
    total: number
  }
  
  // Real-time updates
  lastUpdate: number
}

const initialState: DevicesState = {
  devices: [],
  selectedDevice: null,
  telemetryData: {},
  simulations: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isLoadingTelemetry: false,
  isSimulating: false,
  error: null,
  telemetryError: null,
  simulationError: null,
  filters: {
    deviceType: 'all',
    status: 'all',
    search: '',
  },
  sortBy: 'created_at',
  sortOrder: 'desc',
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
  lastUpdate: 0,
}

// Async thunks
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async (_, { rejectWithValue }) => {
    try {
      const devices = await getDevices()
      return devices
    } catch (error) {
      console.error('Fetch devices failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch devices')
    }
  }
)

export const addDevice = createAsyncThunk(
  'devices/addDevice',
  async (deviceData: DeviceInsert, { rejectWithValue }) => {
    try {
      const device = await createDevice(deviceData)
      return device
    } catch (error) {
      console.error('Create device failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create device')
    }
  }
)

export const editDevice = createAsyncThunk(
  'devices/editDevice',
  async ({ id, updates }: { id: string; updates: DeviceUpdate }, { rejectWithValue }) => {
    try {
      const device = await updateDevice(id, updates)
      return device
    } catch (error) {
      console.error('Update device failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update device')
    }
  }
)

export const removeDevice = createAsyncThunk(
  'devices/removeDevice',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteDevice(id)
      return id
    } catch (error) {
      console.error('Delete device failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete device')
    }
  }
)

export const fetchTelemetry = createAsyncThunk(
  'devices/fetchTelemetry',
  async ({ deviceId, options }: { deviceId: string; options?: { limit?: number; offset?: number } }, { rejectWithValue }) => {
    try {
      const telemetry = await getTelemetry(deviceId, options)
      return { deviceId, telemetry }
    } catch (error) {
      console.error('Fetch telemetry failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch telemetry')
    }
  }
)

export const simulateDevice = createAsyncThunk(
  'devices/simulateDevice',
  async ({ deviceId, payload }: { deviceId: string; payload: Record<string, any> }, { rejectWithValue }) => {
    try {
      const result = await simulateTTNUplink(deviceId, payload)
      return { deviceId, result }
    } catch (error) {
      console.error('Device simulation failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to simulate device')
    }
  }
)

const devicesSlice = createSlice({
  name: 'devices',
  initialState,
  reducers: {
    // UI Actions
    setSelectedDevice: (state, action: PayloadAction<Device | null>) => {
      state.selectedDevice = action.payload
    },
    
    setFilters: (state, action: PayloadAction<Partial<DevicesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    
    setSorting: (state, action: PayloadAction<{ sortBy: DevicesState['sortBy']; sortOrder: DevicesState['sortOrder'] }>) => {
      state.sortBy = action.payload.sortBy
      state.sortOrder = action.payload.sortOrder
    },
    
    setPagination: (state, action: PayloadAction<Partial<DevicesState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    
    clearError: (state) => {
      state.error = null
      state.telemetryError = null
      state.simulationError = null
    },
    
    // Simulation Management
    startSimulation: (state, action: PayloadAction<{ deviceId: string; interval: number }>) => {
      const { deviceId, interval } = action.payload
      state.simulations[deviceId] = {
        isActive: true,
        interval,
        lastSimulated: null,
      }
    },
    
    stopSimulation: (state, action: PayloadAction<string>) => {
      const deviceId = action.payload
      if (state.simulations[deviceId]) {
        state.simulations[deviceId].isActive = false
      }
    },
    
    updateSimulationTime: (state, action: PayloadAction<string>) => {
      const deviceId = action.payload
      if (state.simulations[deviceId]) {
        state.simulations[deviceId].lastSimulated = Date.now()
      }
    },
    
    // Real-time telemetry updates (WebSocket)
    addTelemetryData: (state, action: PayloadAction<{ deviceId: string; telemetry: Telemetry }>) => {
      const { deviceId, telemetry } = action.payload
      
      if (!state.telemetryData[deviceId]) {
        state.telemetryData[deviceId] = []
      }
      
      // Add new telemetry and keep only last 100 entries for performance
      state.telemetryData[deviceId].unshift(telemetry)
      if (state.telemetryData[deviceId].length > 100) {
        state.telemetryData[deviceId] = state.telemetryData[deviceId].slice(0, 100)
      }
      
      state.lastUpdate = Date.now()
    },
    
    // Device status updates (WebSocket)
    updateDeviceStatus: (state, action: PayloadAction<{ deviceId: string; status: 'active' | 'inactive' | 'error' }>) => {
      const { deviceId, status } = action.payload
      const device = state.devices.find(d => d.id === deviceId)
      if (device) {
        device.status = status
        device.updated_at = Math.floor(Date.now() / 1000)
      }
      state.lastUpdate = Date.now()
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Devices
      .addCase(fetchDevices.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.isLoading = false
        state.devices = action.payload
        state.pagination.total = action.payload.length
        state.lastUpdate = Date.now()
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Add Device
      .addCase(addDevice.pending, (state) => {
        state.isCreating = true
        state.error = null
      })
      .addCase(addDevice.fulfilled, (state, action) => {
        state.isCreating = false
        state.devices.unshift(action.payload)
        state.pagination.total += 1
        state.lastUpdate = Date.now()
      })
      .addCase(addDevice.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload as string
      })
      
      // Edit Device
      .addCase(editDevice.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(editDevice.fulfilled, (state, action) => {
        state.isUpdating = false
        const index = state.devices.findIndex(d => d.id === action.payload.id)
        if (index !== -1) {
          state.devices[index] = action.payload
        }
        if (state.selectedDevice?.id === action.payload.id) {
          state.selectedDevice = action.payload
        }
        state.lastUpdate = Date.now()
      })
      .addCase(editDevice.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      
      // Remove Device
      .addCase(removeDevice.pending, (state) => {
        state.isDeleting = true
        state.error = null
      })
      .addCase(removeDevice.fulfilled, (state, action) => {
        state.isDeleting = false
        state.devices = state.devices.filter(d => d.id !== action.payload)
        
        // Clean up related data
        delete state.telemetryData[action.payload]
        delete state.simulations[action.payload]
        
        if (state.selectedDevice?.id === action.payload) {
          state.selectedDevice = null
        }
        
        state.pagination.total = Math.max(0, state.pagination.total - 1)
        state.lastUpdate = Date.now()
      })
      .addCase(removeDevice.rejected, (state, action) => {
        state.isDeleting = false
        state.error = action.payload as string
      })
      
      // Fetch Telemetry
      .addCase(fetchTelemetry.pending, (state) => {
        state.isLoadingTelemetry = true
        state.telemetryError = null
      })
      .addCase(fetchTelemetry.fulfilled, (state, action) => {
        state.isLoadingTelemetry = false
        const { deviceId, telemetry } = action.payload
        state.telemetryData[deviceId] = telemetry
      })
      .addCase(fetchTelemetry.rejected, (state, action) => {
        state.isLoadingTelemetry = false
        state.telemetryError = action.payload as string
      })
      
      // Simulate Device
      .addCase(simulateDevice.pending, (state) => {
        state.isSimulating = true
        state.simulationError = null
      })
      .addCase(simulateDevice.fulfilled, (state, action) => {
        state.isSimulating = false
        const { deviceId } = action.payload
        
        // Update simulation timestamp
        if (state.simulations[deviceId]) {
          state.simulations[deviceId].lastSimulated = Date.now()
        }
      })
      .addCase(simulateDevice.rejected, (state, action) => {
        state.isSimulating = false
        state.simulationError = action.payload as string
      })
  },
})

export const {
  setSelectedDevice,
  setFilters,
  setSorting,
  setPagination,
  clearError,
  startSimulation,
  stopSimulation,
  updateSimulationTime,
  addTelemetryData,
  updateDeviceStatus,
} = devicesSlice.actions

// Selectors
export const selectDevices = (state: { devices: DevicesState }) => state.devices.devices
export const selectSelectedDevice = (state: { devices: DevicesState }) => state.devices.selectedDevice
export const selectDeviceById = (deviceId: string) => (state: { devices: DevicesState }) =>
  state.devices.devices.find(d => d.id === deviceId)

export const selectTelemetryData = (state: { devices: DevicesState }) => state.devices.telemetryData
export const selectTelemetryByDevice = (deviceId: string) => (state: { devices: DevicesState }) =>
  state.devices.telemetryData[deviceId] || []

export const selectSimulations = (state: { devices: DevicesState }) => state.devices.simulations
export const selectDeviceSimulation = (deviceId: string) => (state: { devices: DevicesState }) =>
  state.devices.simulations[deviceId]

export const selectDevicesLoading = (state: { devices: DevicesState }) => state.devices.isLoading
export const selectDevicesError = (state: { devices: DevicesState }) => state.devices.error

// Filtered and sorted devices selector
export const selectFilteredDevices = (state: { devices: DevicesState }) => {
  const { devices, filters, sortBy, sortOrder } = state.devices
  
  let filtered = devices
  
  // Apply filters
  if (filters.deviceType !== 'all') {
    filtered = filtered.filter(d => d.device_type === filters.deviceType)
  }
  
  if (filters.status !== 'all') {
    filtered = filtered.filter(d => d.status === filters.status)
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(search) ||
      d.dev_eui.toLowerCase().includes(search)
    )
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'created_at':
        comparison = a.created_at - b.created_at
        break
      case 'device_type':
        comparison = a.device_type.localeCompare(b.device_type)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      default:
        comparison = 0
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })
  
  return filtered
}

export const selectDeviceStats = (state: { devices: DevicesState }) => {
  const devices = state.devices.devices
  
  return {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    inactive: devices.filter(d => d.status === 'inactive').length,
    error: devices.filter(d => d.status === 'error').length,
    byType: devices.reduce((acc, device) => {
      acc[device.device_type] = (acc[device.device_type] || 0) + 1
      return acc
    }, {} as Record<DeviceType, number>),
  }
}

export default devicesSlice.reducer