import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function DeviceEmulator() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            LoRaWAN Device Emulator
          </h1>
          <p className="text-muted-foreground mt-2">
            Simulate LoRaWAN sensors and test TTN integration
          </p>
        </div>

        {/* Main Content Area */}
        <div className="bg-card border rounded-lg p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Emulator interface will be implemented here
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This will include device management, telemetry simulation, and TTN configuration
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
