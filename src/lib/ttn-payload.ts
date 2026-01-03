/**
 * The Things Network (TTN) v3 Payload Utilities
 * Types and utilities for TTN uplink/downlink messages and payload encoding
 */

// ==========================================
// TTN Configuration Types
// ==========================================

export interface TTNConfig {
  appId: string
  apiKey: string
  webhookUrl: string
  region: string // e.g., 'eu1', 'nam1', 'au1'
}

export interface TTNValidationResult {
  valid: boolean
  errors?: string[]
}

// ==========================================
// TTN v3 Message Types
// ==========================================

/**
 * TTN v3 Uplink Message Structure
 * Based on TTN v3 HTTP API specification
 */
export interface UplinkMessage {
  end_device_ids: {
    device_id: string
    dev_eui: string
    dev_addr?: string
    application_ids: {
      application_id: string
    }
  }
  uplink_message: {
    session_key_id?: string
    f_port: number
    f_cnt: number
    frm_payload: string // base64 encoded payload
    decoded_payload?: Record<string, any>
    rx_metadata: Array<{
      gateway_ids: {
        gateway_id: string
        eui?: string
      }
      time?: string
      timestamp?: number
      rssi: number
      channel_rssi?: number
      snr: number
      uplink_token?: string
      channel_index?: number
    }>
    settings: {
      data_rate: {
        lora?: {
          bandwidth: number
          spreading_factor: number
        }
      }
      coding_rate?: string
      frequency: string
      timestamp?: number
    }
    received_at?: string
    consumed_airtime?: string
    network_ids?: {
      net_id?: string
      tenant_id?: string
      cluster_id?: string
    }
  }
}

/**
 * Sensor reading payload structure
 * Represents decoded sensor data
 */
export interface SensorReading {
  temperature?: number // in Celsius
  humidity?: number // in percentage (0-100)
  battery?: number // in volts or percentage
  door_open?: boolean // door sensor state
  timestamp?: number // Unix timestamp (optional)
  [key: string]: any // Allow additional sensor types
}

// ==========================================
// Validation Functions
// ==========================================

/**
 * Validate TTN configuration
 * Checks that all required fields are present and properly formatted
 */
export function validateTTNConfig(config: Partial<TTNConfig>): TTNValidationResult {
  const errors: string[] = []

  // Application ID validation
  if (!config.appId || config.appId.trim() === '') {
    errors.push('Application ID is required')
  } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(config.appId)) {
    errors.push('Application ID must be lowercase alphanumeric with hyphens')
  }

  // API Key validation
  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push('API Key is required')
  } else if (config.apiKey.length < 32) {
    errors.push('API Key appears to be invalid (too short)')
  }

  // Webhook URL validation
  if (config.webhookUrl && config.webhookUrl.trim() !== '') {
    try {
      const url = new URL(config.webhookUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('Webhook URL must use HTTP or HTTPS protocol')
      }
    } catch {
      errors.push('Webhook URL is not a valid URL')
    }
  }

  // Region validation
  const validRegions = ['eu1', 'nam1', 'au1', 'as1']
  if (!config.region || config.region.trim() === '') {
    errors.push('Region is required')
  } else if (!validRegions.includes(config.region)) {
    errors.push(`Region must be one of: ${validRegions.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validate DevEUI format
 * DevEUI should be 16 hex characters (8 bytes)
 */
export function validateDevEUI(devEui: string): boolean {
  return /^[0-9A-Fa-f]{16}$/.test(devEui)
}

// ==========================================
// Payload Encoding/Decoding
// ==========================================

/**
 * Encode sensor reading to base64 payload
 * Converts JSON sensor data to base64-encoded string for TTN
 */
export function encodePayload(data: SensorReading): string {
  // Create a simple byte buffer for common sensor types
  // Format: [temp_high, temp_low, humidity, battery, flags]
  const buffer: number[] = []

  if (data.temperature !== undefined) {
    // Temperature in 0.01°C units, signed 16-bit
    const tempValue = Math.round(data.temperature * 100)
    buffer.push((tempValue >> 8) & 0xff) // High byte
    buffer.push(tempValue & 0xff) // Low byte
  } else {
    buffer.push(0xff, 0xff) // No temperature data
  }

  if (data.humidity !== undefined) {
    // Humidity in 0.5% units, unsigned 8-bit
    buffer.push(Math.round(data.humidity * 2))
  } else {
    buffer.push(0xff) // No humidity data
  }

  if (data.battery !== undefined) {
    // Battery in 0.01V units, unsigned 8-bit (0-255 = 0-2.55V)
    buffer.push(Math.round(data.battery * 100))
  } else {
    buffer.push(0xff) // No battery data
  }

  // Flags byte (bit 0: door_open)
  let flags = 0
  if (data.door_open) {
    flags |= 0x01
  }
  buffer.push(flags)

  // Convert byte array to base64
  const uint8Array = new Uint8Array(buffer)
  return btoa(String.fromCharCode(...uint8Array))
}

/**
 * Decode base64 payload to sensor reading
 * Converts base64-encoded TTN payload back to JSON sensor data
 */
export function decodePayload(payload: string): SensorReading {
  try {
    // Decode base64 to byte array
    const binaryString = atob(payload)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const reading: SensorReading = {}

    // Temperature (bytes 0-1)
    if (bytes.length >= 2 && !(bytes[0] === 0xff && bytes[1] === 0xff)) {
      const tempRaw = (bytes[0] << 8) | bytes[1]
      // Convert from unsigned to signed 16-bit
      const tempSigned = tempRaw > 32767 ? tempRaw - 65536 : tempRaw
      reading.temperature = tempSigned / 100
    }

    // Humidity (byte 2)
    if (bytes.length >= 3 && bytes[2] !== 0xff) {
      reading.humidity = bytes[2] / 2
    }

    // Battery (byte 3)
    if (bytes.length >= 4 && bytes[3] !== 0xff) {
      reading.battery = bytes[3] / 100
    }

    // Flags (byte 4)
    if (bytes.length >= 5) {
      reading.door_open = (bytes[4] & 0x01) !== 0
    }

    return reading
  } catch (error) {
    console.error('Failed to decode payload:', error)
    return {}
  }
}

// ==========================================
// Message Formatting
// ==========================================

/**
 * Format uplink message for TTN API
 * Creates a properly structured TTN v3 uplink message
 */
export function formatUplink(
  deviceId: string,
  devEui: string,
  appId: string,
  payload: SensorReading,
  options: {
    fPort?: number
    fCnt?: number
    rssi?: number
    snr?: number
    frequency?: string
    spreadingFactor?: number
    bandwidth?: number
  } = {}
): UplinkMessage {
  const {
    fPort = 1,
    fCnt = 1,
    rssi = -60,
    snr = 9.5,
    frequency = '868.1',
    spreadingFactor = 7,
    bandwidth = 125000,
  } = options

  const encodedPayload = encodePayload(payload)

  return {
    end_device_ids: {
      device_id: deviceId,
      dev_eui: devEui,
      application_ids: {
        application_id: appId,
      },
    },
    uplink_message: {
      f_port: fPort,
      f_cnt: fCnt,
      frm_payload: encodedPayload,
      decoded_payload: payload,
      rx_metadata: [
        {
          gateway_ids: {
            gateway_id: 'simulated-gateway',
            eui: 'AA555A0000000000',
          },
          rssi,
          snr,
          time: new Date().toISOString(),
          timestamp: Date.now(),
        },
      ],
      settings: {
        data_rate: {
          lora: {
            bandwidth,
            spreading_factor: spreadingFactor,
          },
        },
        frequency,
      },
      received_at: new Date().toISOString(),
    },
  }
}

/**
 * Generate random sensor reading for simulation
 * Creates realistic sensor data with optional ranges
 */
export function generateRandomReading(
  deviceType: 'temperature' | 'humidity' | 'door',
  params?: {
    minTemp?: number
    maxTemp?: number
    minHumidity?: number
    maxHumidity?: number
  }
): SensorReading {
  const {
    minTemp = -20,
    maxTemp = 40,
    minHumidity = 20,
    maxHumidity = 90,
  } = params || {}

  const reading: SensorReading = {
    battery: 3.0 + Math.random() * 0.6, // 3.0V - 3.6V
    timestamp: Math.floor(Date.now() / 1000),
  }

  switch (deviceType) {
    case 'temperature':
      reading.temperature =
        minTemp + Math.random() * (maxTemp - minTemp)
      break

    case 'humidity':
      reading.humidity =
        minHumidity + Math.random() * (maxHumidity - minHumidity)
      break

    case 'door':
      reading.door_open = Math.random() > 0.7 // 30% chance of open
      break
  }

  return reading
}

// ==========================================
// TTN API URL Helpers
// ==========================================

/**
 * Get TTN API base URL for a region
 */
export function getTTNApiUrl(region: string): string {
  return `https://${region}.cloud.thethings.network/api/v3`
}

/**
 * Get application API endpoint URL
 */
export function getApplicationApiUrl(region: string, appId: string): string {
  return `${getTTNApiUrl(region)}/as/applications/${appId}`
}

/**
 * Get uplink simulation endpoint URL
 */
export function getUplinkSimulateUrl(region: string, appId: string): string {
  return `${getApplicationApiUrl(region, appId)}/webhooks/uplink/simulate`
}
