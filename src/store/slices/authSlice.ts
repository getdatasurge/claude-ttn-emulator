/**
 * Authentication State Management
 * Integrates with Stack Auth and manages user session state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { stackClientApp, isStackAuthConfigured } from '@/lib/stackAuth'

// Serializable user data for Redux store
export interface SerializedUser {
  id: string
  primaryEmail: string | null
  displayName: string | null
  profileImageUrl: string | null
  clientMetadata: Record<string, unknown>
  selectedTeamId: string | null
}

export interface AuthState {
  user: SerializedUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // Extended user data from Stack Auth metadata
  organizationId: string | null
  role: string | null
  // Session management
  sessionExpiry: number | null
  lastActivity: number
  // Connection status
  isOnline: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  organizationId: null,
  role: null,
  sessionExpiry: null,
  lastActivity: Date.now(),
  isOnline: navigator.onLine,
}

// Helper to serialize user object for Redux
function serializeUser(user: any): SerializedUser {
  return {
    id: user.id,
    primaryEmail: user.primaryEmail || null,
    displayName: user.displayName || null,
    profileImageUrl: user.profileImageUrl || null,
    clientMetadata: user.clientMetadata || {},
    selectedTeamId: user.selectedTeam?.id || null,
  }
}

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    // Skip if Stack Auth is not configured
    if (!isStackAuthConfigured || !stackClientApp) {
      return null
    }

    try {
      const user = await stackClientApp.getUser()
      if (user) {
        return {
          user: serializeUser(user),
          organizationId: (user.clientMetadata?.organizationId as string) || null,
          role: (user.clientMetadata?.role as string) || null,
        }
      }
      return null
    } catch (error) {
      console.error('Auth initialization failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Authentication failed')
    }
  }
)

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    if (!isStackAuthConfigured || !stackClientApp) {
      return null
    }

    try {
      await stackClientApp.signOut()
      return null
    } catch (error) {
      console.error('Sign out failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Sign out failed')
    }
  }
)

export const refreshUserData = createAsyncThunk(
  'auth/refreshUserData',
  async (_, { rejectWithValue }) => {
    if (!isStackAuthConfigured || !stackClientApp) {
      return rejectWithValue('Stack Auth not configured')
    }

    try {
      const user = await stackClientApp.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      return {
        user: serializeUser(user),
        organizationId: (user.clientMetadata?.organizationId as string) || null,
        role: (user.clientMetadata?.role as string) || null,
      }
    } catch (error) {
      console.error('Refresh user data failed:', error)
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to refresh user data')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateLastActivity: (state) => {
      state.lastActivity = Date.now()
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    setSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload
    },
    // Manual user update for real-time sync
    updateUser: (state, action: PayloadAction<{
      user: SerializedUser
      organizationId?: string
      role?: string
    }>) => {
      state.user = action.payload.user
      if (action.payload.organizationId !== undefined) {
        state.organizationId = action.payload.organizationId
      }
      if (action.payload.role !== undefined) {
        state.role = action.payload.role
      }
      state.isAuthenticated = true
      state.lastActivity = Date.now()
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        
        if (action.payload) {
          state.user = action.payload.user
          state.organizationId = action.payload.organizationId
          state.role = action.payload.role
          state.isAuthenticated = true
        } else {
          state.user = null
          state.organizationId = null
          state.role = null
          state.isAuthenticated = false
        }
        state.lastActivity = Date.now()
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.user = null
        state.organizationId = null
        state.role = null
        state.isAuthenticated = false
      })
      
      // Sign Out
      .addCase(signOut.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
        state.user = null
        state.organizationId = null
        state.role = null
        state.isAuthenticated = false
        state.sessionExpiry = null
        state.lastActivity = Date.now()
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        // Still clear user data even if signout request failed
        state.user = null
        state.organizationId = null
        state.role = null
        state.isAuthenticated = false
      })
      
      // Refresh User Data
      .addCase(refreshUserData.pending, (state) => {
        state.error = null
      })
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.organizationId = action.payload.organizationId
        state.role = action.payload.role
        state.isAuthenticated = true
        state.lastActivity = Date.now()
        state.error = null
      })
      .addCase(refreshUserData.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const {
  updateLastActivity,
  setOnlineStatus,
  clearError,
  setSessionExpiry,
  updateUser,
} = authSlice.actions

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectOrganizationId = (state: { auth: AuthState }) => state.auth.organizationId
export const selectUserRole = (state: { auth: AuthState }) => state.auth.role
export const selectIsAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectIsOnline = (state: { auth: AuthState }) => state.auth.isOnline
export const selectSessionExpiry = (state: { auth: AuthState }) => state.auth.sessionExpiry

// Helper selectors
export const selectIsAdmin = (state: { auth: AuthState }) => 
  state.auth.role === 'admin'

export const selectCanManageDevices = (state: { auth: AuthState }) => 
  state.auth.role === 'admin' || state.auth.role === 'manager'

export const selectSessionTimeRemaining = (state: { auth: AuthState }) => {
  if (!state.auth.sessionExpiry) return null
  return Math.max(0, state.auth.sessionExpiry - Date.now())
}

export const selectIsSessionExpired = (state: { auth: AuthState }) => {
  if (!state.auth.sessionExpiry) return false
  return Date.now() > state.auth.sessionExpiry
}

export const selectUserDisplayName = (state: { auth: AuthState }) => 
  state.auth.user?.displayName || state.auth.user?.primaryEmail || 'Unknown User'

export default authSlice.reducer