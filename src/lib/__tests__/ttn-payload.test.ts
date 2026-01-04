/**
 * TTN Payload Utilities Tests
 * Tests for TTN payload encoding, decoding, and validation
 */

import { describe, it, expect } from 'vitest'
import {
  validateTTNConfig,
  validateDevEUI,
  encodePayload,
  decodePayload,
  formatUplink,
  generateRandomReading,
  getTTNApiUrl,
  getApplicationApiUrl,
  getUplinkSimulateUrl,
  type TTNConfig,
  type SensorReading,
} from '../ttn-payload'

describe('TTN Payload Utilities', () => {
  describe('validateTTNConfig', () => {
    it('should validate correct TTN config', () => {
      const config: TTNConfig = {
        appId: 'test-app',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        webhookUrl: 'https://example.com/webhook',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should reject empty app ID', () => {
      const config = {
        appId: '',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Application ID is required')
    })

    it('should reject invalid app ID format', () => {
      const config = {
        appId: 'Test_App', // Contains uppercase and underscore
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Application ID must be lowercase alphanumeric with hyphens'
      )
    })

    it('should reject empty API key', () => {
      const config = {
        appId: 'test-app',
        apiKey: '',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('API Key is required')
    })

    it('should reject short API key', () => {
      const config = {
        appId: 'test-app',
        apiKey: 'short-key',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('API Key appears to be invalid (too short)')
    })

    it('should accept valid webhook URL', () => {
      const config = {
        appId: 'test-app',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        webhookUrl: 'https://example.com/webhook',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(true)
    })

    it('should accept empty webhook URL', () => {
      const config = {
        appId: 'test-app',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        webhookUrl: '',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(true)
    })

    it('should reject invalid webhook URL', () => {
      const config = {
        appId: 'test-app',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        webhookUrl: 'not-a-url',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Webhook URL is not a valid URL')
    })

    it('should reject non-HTTP(S) webhook URL', () => {
      const config = {
        appId: 'test-app',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        webhookUrl: 'ftp://example.com/webhook',
        region: 'eu1',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Webhook URL must use HTTP or HTTPS protocol')
    })

    it('should reject empty region', () => {
      const config = {
        appId: 'test-app',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        region: '',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Region is required')
    })

    it('should reject invalid region', () => {
      const config = {
        appId: 'test-app',
        apiKey: 'NNSXS.ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
        region: 'invalid',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Region must be one of: eu1, nam1, au1, as1')
    })

    it('should collect multiple errors', () => {
      const config = {
        appId: '',
        apiKey: 'short',
        region: 'invalid',
      }

      const result = validateTTNConfig(config)

      expect(result.valid).toBe(false)
      // 3 errors: empty appId, short apiKey, invalid region
      expect(result.errors).toHaveLength(3)
    })
  })

  describe('validateDevEUI', () => {
    it('should validate correct DevEUI', () => {
      expect(validateDevEUI('0004A30B001A2B3C')).toBe(true)
      expect(validateDevEUI('FFFFFFFFFFFFFFFF')).toBe(true)
      expect(validateDevEUI('0000000000000000')).toBe(true)
    })

    it('should accept lowercase hex', () => {
      expect(validateDevEUI('0004a30b001a2b3c')).toBe(true)
    })

    it('should accept mixed case', () => {
      expect(validateDevEUI('0004A30b001A2b3C')).toBe(true)
    })

    it('should reject short DevEUI', () => {
      expect(validateDevEUI('0004A30B')).toBe(false)
    })

    it('should reject long DevEUI', () => {
      expect(validateDevEUI('0004A30B001A2B3C00')).toBe(false)
    })

    it('should reject non-hex characters', () => {
      expect(validateDevEUI('0004A30G001A2B3C')).toBe(false)
      expect(validateDevEUI('0004A30-001A2B3C')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(validateDevEUI('')).toBe(false)
    })
  })

  describe('encodePayload and decodePayload', () => {
    it('should encode and decode temperature reading', () => {
      const reading: SensorReading = {
        temperature: 5.25,
      }

      const encoded = encodePayload(reading)
      const decoded = decodePayload(encoded)

      expect(decoded.temperature).toBeCloseTo(5.25, 1)
    })

    it('should encode and decode humidity reading', () => {
      const reading: SensorReading = {
        humidity: 65.5,
      }

      const encoded = encodePayload(reading)
      const decoded = decodePayload(encoded)

      expect(decoded.humidity).toBeCloseTo(65.5, 0)
    })

    it('should encode and decode battery reading', () => {
      // Note: Battery encoding uses 8-bit (0-255 = 0-2.55V)
      const reading: SensorReading = {
        battery: 2.45,
      }

      const encoded = encodePayload(reading)
      const decoded = decodePayload(encoded)

      expect(decoded.battery).toBeCloseTo(2.45, 1)
    })

    it('should encode and decode door sensor reading', () => {
      const reading: SensorReading = {
        door_open: true,
      }

      const encoded = encodePayload(reading)
      const decoded = decodePayload(encoded)

      expect(decoded.door_open).toBe(true)
    })

    it('should encode and decode complete reading', () => {
      // Note: Battery encoding uses 8-bit (0-255 = 0-2.55V)
      const reading: SensorReading = {
        temperature: -10.5,
        humidity: 78.0,
        battery: 2.20,
        door_open: false,
      }

      const encoded = encodePayload(reading)
      const decoded = decodePayload(encoded)

      expect(decoded.temperature).toBeCloseTo(-10.5, 1)
      expect(decoded.humidity).toBeCloseTo(78.0, 0)
      expect(decoded.battery).toBeCloseTo(2.20, 1)
      expect(decoded.door_open).toBe(false)
    })

    it('should handle negative temperatures', () => {
      const reading: SensorReading = {
        temperature: -20.0,
      }

      const encoded = encodePayload(reading)
      const decoded = decodePayload(encoded)

      expect(decoded.temperature).toBeCloseTo(-20.0, 1)
    })

    it('should handle edge case temperatures', () => {
      const readings = [
        { temperature: 0.0 },
        { temperature: -40.0 },
        { temperature: 85.0 },
      ]

      readings.forEach(reading => {
        const encoded = encodePayload(reading)
        const decoded = decodePayload(encoded)
        expect(decoded.temperature).toBeCloseTo(reading.temperature!, 1)
      })
    })

    it('should encode undefined values as 0xff markers', () => {
      const reading: SensorReading = {}

      const encoded = encodePayload(reading)
      const decoded = decodePayload(encoded)

      expect(decoded.temperature).toBeUndefined()
      expect(decoded.humidity).toBeUndefined()
      expect(decoded.battery).toBeUndefined()
    })

    it('should handle invalid base64 gracefully', () => {
      const decoded = decodePayload('invalid-base64!!!')

      expect(decoded).toEqual({})
    })
  })

  describe('formatUplink', () => {
    it('should format uplink message with required fields', () => {
      const payload: SensorReading = {
        temperature: 5.2,
        battery: 3.4,
      }

      const uplink = formatUplink('test-device', '0004A30B001A2B3C', 'test-app', payload)

      expect(uplink.end_device_ids.device_id).toBe('test-device')
      expect(uplink.end_device_ids.dev_eui).toBe('0004A30B001A2B3C')
      expect(uplink.end_device_ids.application_ids.application_id).toBe('test-app')
      expect(uplink.uplink_message.f_port).toBe(1)
      expect(uplink.uplink_message.f_cnt).toBe(1)
      expect(uplink.uplink_message.decoded_payload).toEqual(payload)
    })

    it('should format uplink with custom options', () => {
      const payload: SensorReading = {
        temperature: 5.2,
      }

      const uplink = formatUplink('test-device', '0004A30B001A2B3C', 'test-app', payload, {
        fPort: 2,
        fCnt: 42,
        rssi: -70,
        snr: 8.5,
        frequency: '868.3',
        spreadingFactor: 9,
        bandwidth: 250000,
      })

      expect(uplink.uplink_message.f_port).toBe(2)
      expect(uplink.uplink_message.f_cnt).toBe(42)
      expect(uplink.uplink_message.rx_metadata[0].rssi).toBe(-70)
      expect(uplink.uplink_message.rx_metadata[0].snr).toBe(8.5)
      expect(uplink.uplink_message.settings.frequency).toBe('868.3')
      expect(uplink.uplink_message.settings.data_rate.lora?.spreading_factor).toBe(9)
      expect(uplink.uplink_message.settings.data_rate.lora?.bandwidth).toBe(250000)
    })

    it('should include base64 encoded payload', () => {
      const payload: SensorReading = {
        temperature: 5.2,
      }

      const uplink = formatUplink('test-device', '0004A30B001A2B3C', 'test-app', payload)

      expect(uplink.uplink_message.frm_payload).toBeTruthy()
      expect(typeof uplink.uplink_message.frm_payload).toBe('string')
    })

    it('should include gateway metadata', () => {
      const payload: SensorReading = {
        temperature: 5.2,
      }

      const uplink = formatUplink('test-device', '0004A30B001A2B3C', 'test-app', payload)

      expect(uplink.uplink_message.rx_metadata).toHaveLength(1)
      expect(uplink.uplink_message.rx_metadata[0].gateway_ids.gateway_id).toBe(
        'simulated-gateway'
      )
      expect(uplink.uplink_message.rx_metadata[0].gateway_ids.eui).toBe(
        'AA555A0000000000'
      )
    })

    it('should include timestamps', () => {
      const payload: SensorReading = {
        temperature: 5.2,
      }

      const uplink = formatUplink('test-device', '0004A30B001A2B3C', 'test-app', payload)

      expect(uplink.uplink_message.rx_metadata[0].time).toBeTruthy()
      expect(uplink.uplink_message.rx_metadata[0].timestamp).toBeGreaterThan(0)
      expect(uplink.uplink_message.received_at).toBeTruthy()
    })
  })

  describe('generateRandomReading', () => {
    it('should generate temperature reading', () => {
      const reading = generateRandomReading('temperature')

      expect(reading.temperature).toBeDefined()
      expect(reading.battery).toBeDefined()
      expect(reading.timestamp).toBeDefined()
      expect(reading.humidity).toBeUndefined()
      expect(reading.door_open).toBeUndefined()
    })

    it('should generate temperature within range', () => {
      const reading = generateRandomReading('temperature', {
        minTemp: 0,
        maxTemp: 10,
      })

      expect(reading.temperature).toBeGreaterThanOrEqual(0)
      expect(reading.temperature).toBeLessThanOrEqual(10)
    })

    it('should generate humidity reading', () => {
      const reading = generateRandomReading('humidity')

      expect(reading.humidity).toBeDefined()
      expect(reading.battery).toBeDefined()
      expect(reading.timestamp).toBeDefined()
      expect(reading.temperature).toBeUndefined()
      expect(reading.door_open).toBeUndefined()
    })

    it('should generate humidity within range', () => {
      const reading = generateRandomReading('humidity', {
        minHumidity: 40,
        maxHumidity: 60,
      })

      expect(reading.humidity).toBeGreaterThanOrEqual(40)
      expect(reading.humidity).toBeLessThanOrEqual(60)
    })

    it('should generate door sensor reading', () => {
      const reading = generateRandomReading('door')

      expect(reading.door_open).toBeDefined()
      expect(typeof reading.door_open).toBe('boolean')
      expect(reading.battery).toBeDefined()
      expect(reading.timestamp).toBeDefined()
    })

    it('should generate battery reading between 3.0V and 3.6V', () => {
      const reading = generateRandomReading('temperature')

      expect(reading.battery).toBeGreaterThanOrEqual(3.0)
      expect(reading.battery).toBeLessThanOrEqual(3.6)
    })

    it('should generate timestamp near current time', () => {
      const reading = generateRandomReading('temperature')
      const now = Math.floor(Date.now() / 1000)

      expect(reading.timestamp).toBeGreaterThanOrEqual(now - 1)
      expect(reading.timestamp).toBeLessThanOrEqual(now + 1)
    })
  })

  describe('TTN API URL Helpers', () => {
    it('should generate correct API base URL', () => {
      expect(getTTNApiUrl('eu1')).toBe('https://eu1.cloud.thethings.network/api/v3')
      expect(getTTNApiUrl('nam1')).toBe('https://nam1.cloud.thethings.network/api/v3')
      expect(getTTNApiUrl('au1')).toBe('https://au1.cloud.thethings.network/api/v3')
    })

    it('should generate correct application API URL', () => {
      const url = getApplicationApiUrl('eu1', 'test-app')

      expect(url).toBe('https://eu1.cloud.thethings.network/api/v3/as/applications/test-app')
    })

    it('should generate correct uplink simulate URL', () => {
      const url = getUplinkSimulateUrl('eu1', 'test-app')

      expect(url).toBe(
        'https://eu1.cloud.thethings.network/api/v3/as/applications/test-app/webhooks/uplink/simulate'
      )
    })
  })
})
