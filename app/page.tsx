"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, Download } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Geotechnical Engineering Suite</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional grain size distribution analysis and reporting tools for geotechnical engineering
              applications
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-blue-600" />
                <CardTitle>Scientific Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  ASTM/USCS compliant grain size distribution curves with logarithmic scaling and proper interpolation
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 mx-auto text-green-600" />
                <CardTitle>Professional Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate publication-ready charts and reports suitable for formal engineering documentation
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Download className="w-12 h-12 mx-auto text-purple-600" />
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  High-resolution PNG and PDF export capabilities with proper formatting for presentations and reports
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Link href="/grain-chart">
              <Button size="lg" className="text-lg px-8 py-3">
                Open Grain Size Distribution Chart
              </Button>
            </Link>
          </div>

          {/* Technical Specifications */}
          <Card className="mt-12 text-left">
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Chart Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Logarithmic X-axis (100mm to 0.001mm)</li>
                    <li>• Linear Y-axis (0% to 100% passing)</li>
                    <li>• Combined sieve and hydrometer data</li>
                    <li>• Up to 10 samples per chart</li>
                    <li>• Unique symbols and colors per sample</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Export Capabilities</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• High-resolution PNG (2x scale)</li>
                    <li>• A4 PDF with proper margins</li>
                    <li>• Serverless PDF generation</li>
                    <li>• Print-optimized layouts</li>
                    <li>• Professional typography</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
