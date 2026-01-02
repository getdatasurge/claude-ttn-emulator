import { Link } from 'react-router-dom'
import { Activity, Thermometer } from 'lucide-react'

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <Activity className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              FrostGuard LoRaWAN Emulator
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
              Web-based simulator for LoRaWAN sensors
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Integrated with The Things Network & Supabase
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <Thermometer className="w-12 h-12 text-blue-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Sensor Simulation
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simulate temperature, humidity, and door sensors for refrigerator/freezer monitoring
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <Activity className="w-12 h-12 text-green-500 mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Real-time Testing
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Test TTN integration and multi-tenant IoT data flow in real-time
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <svg className="w-12 h-12 text-purple-500 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Supabase Backend
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Full-stack development with PostgreSQL, RLS, and Deno Edge Functions
              </p>
            </div>
          </div>

          {/* CTA */}
          <div>
            <Link
              to="/emulator"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Launch Emulator
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Tech Stack */}
          <div className="mt-16 pt-8 border-t border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Built with modern web technologies
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn-ui', 'Supabase', 'TTN'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
