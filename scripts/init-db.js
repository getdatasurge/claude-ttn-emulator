#!/usr/bin/env node

/**
 * Initialize local SQLite database for development
 * This script creates a local SQLite database and runs the schema
 */

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database paths
const dbPath = path.join(__dirname, '..', 'local.db')
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql')

console.log('🔧 Initializing local SQLite database...')

// Check if schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found:', schemaPath)
  process.exit(1)
}

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  console.log('⚠️  Removing existing database...')
  fs.unlinkSync(dbPath)
}

// Create new database
const db = new Database(dbPath)
console.log('✅ Created database file:', dbPath)

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf-8')

// Split by semicolons and execute each statement
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

let successCount = 0
let errorCount = 0

for (const statement of statements) {
  try {
    db.exec(statement)
    successCount++
  } catch (error) {
    console.error(`❌ Failed to execute statement:`, error.message)
    console.error(`   Statement: ${statement.substring(0, 50)}...`)
    errorCount++
  }
}

console.log(`✅ Executed ${successCount} SQL statements`)
if (errorCount > 0) {
  console.log(`⚠️  ${errorCount} statements failed`)
}

// Add some test data
console.log('\n📝 Adding test data...')

try {
  // Insert test organization
  const orgStmt = db.prepare(
    'INSERT INTO organizations (id, name, frostguard_org_id) VALUES (?, ?, ?)'
  )
  orgStmt.run('test-org-1', 'Test Organization', null)
  console.log('✅ Created test organization')

  // Insert test user profile
  const profileStmt = db.prepare(
    'INSERT INTO profiles (id, organization_id, full_name, role) VALUES (?, ?, ?, ?)'
  )
  profileStmt.run('test-user-1', 'test-org-1', 'Test User', 'admin')
  console.log('✅ Created test user profile')

  // Insert TTN settings
  const ttnStmt = db.prepare(
    'INSERT INTO ttn_settings (id, organization_id, app_id, api_key, region) VALUES (?, ?, ?, ?, ?)'
  )
  ttnStmt.run(
    'test-ttn-1',
    'test-org-1',
    'test-app',
    'test-api-key',
    'eu1'
  )
  console.log('✅ Created test TTN settings')

} catch (error) {
  console.error('⚠️  Failed to add test data:', error.message)
}

// Show database info
const tables = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
).all()

console.log('\n📊 Database initialized with tables:')
for (const table of tables) {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
  console.log(`   - ${table.name}: ${count.count} rows`)
}

db.close()
console.log('\n✨ Database initialization complete!')
console.log('   Database location:', dbPath)
console.log('   You can now run: npm run dev')