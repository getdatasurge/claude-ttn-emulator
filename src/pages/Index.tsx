/**
 * Landing Page - FrostGuard LoRaWAN Emulator
 */

import { Link } from 'react-router-dom'
import {
  Radio,
  Thermometer,
  Activity,
  Server,
  Webhook,
  Database,
  ArrowRight,
  Zap,
  Shield,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Index() {
  const features = [
    {
      icon: Thermometer,
      title: 'Sensor Simulation',
      description: 'Simulate temperature, humidity, and door sensors for refrigerator/freezer monitoring',
      color: 'text-primary',
    },
    {
      icon: Radio,
      title: 'LoRaWAN Protocol',
      description: 'Full OTAA device simulation with DevEUI, JoinEUI, and AppKey credentials',
      color: 'text-blue-500',
    },
    {
      icon: Webhook,
      title: 'TTN Integration',
      description: 'Connect to The Things Network and test webhook data flow',
      color: 'text-amber-500',
    },
    {
      icon: Activity,
      title: 'Real-time Testing',
      description: 'Live telemetry monitoring with charts and device status',
      color: 'text-emerald-500',
    },
    {
      icon: Shield,
      title: 'Multi-Tenant',
      description: 'Organization-scoped testing with site and unit hierarchy',
      color: 'text-purple-500',
    },
    {
      icon: Database,
      title: 'Edge Database',
      description: 'Turso SQLite for fast edge database operations',
      color: 'text-rose-500',
    },
  ]

  const techStack = [
    'React 18',
    'TypeScript',
    'Vite',
    'Tailwind CSS',
    'shadcn/ui',
    'TTN v3',
    'Turso',
    'Cloudflare Workers',
    'Stack Auth',
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,hsl(var(--primary))_0%,transparent_50%)] opacity-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,hsl(142_76%_36%)_0%,transparent_50%)] opacity-5" />
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Radio className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                FrostGuard
              </span>{' '}
              <span className="text-foreground">Emulator</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-2">
              LoRaWAN Device Simulator for IoT Development
            </p>
            <p className="text-lg text-muted-foreground/80 mb-8">
              Test temperature, humidity, and door sensors with The Things Network integration
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/login">
                  <Zap className="w-5 h-5 mr-2" />
                  Launch Emulator
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/preview">
                  <Globe className="w-5 h-5 mr-2" />
                  Try Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete development and testing environment for LoRaWAN sensor simulation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="dashboard-card hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Architecture Section */}
      <div className="container mx-auto px-4 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Data Flow Architecture
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Radio className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Emulator</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Server className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">TTN</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Webhook className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium">Webhook</span>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
              <Database className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium">Turso DB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Footer */}
      <div className="container mx-auto px-4 py-12 border-t border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Built with modern web technologies
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-8 font-mono">
            TTN v3 HTTP API • Turso Edge Database • Cloudflare Workers
          </p>
        </div>
      </div>
    </div>
  )
}
