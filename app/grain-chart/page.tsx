"use client"

import { useState } from "react"
import GrainSizeDistributionChart from "@/components/grain-size-distribution-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SampleData } from "@/types/grain-size"
import { CHART_COLORS, CHART_SYMBOLS } from "@/lib/chart-utils"

// Example data for development/testing (clearly separated)
const EXAMPLE_SAMPLES: SampleData[] = [
  {
    id: "sample-1",
    name: "Sample A",
    location: "Borehole BH-1",
    depth: "2.0-2.5m",
    specificGravity: 2.65,
    liquidLimit: 28,
    plasticLimit: 16,
    color: CHART_COLORS[0],
    symbol: CHART_SYMBOLS[0],
    sieveData: [
      {
        sieveSize: 19.0,
        sieveOpening: '3/4"',
        massRetained: 0,
        cumulativeMassRetained: 0,
        percentRetained: 0,
        cumulativePercentRetained: 0,
        percentPassing: 100,
      },
      {
        sieveSize: 9.5,
        sieveOpening: '3/8"',
        massRetained: 15,
        cumulativeMassRetained: 15,
        percentRetained: 3,
        cumulativePercentRetained: 3,
        percentPassing: 97,
      },
      {
        sieveSize: 4.75,
        sieveOpening: "#4",
        massRetained: 25,
        cumulativeMassRetained: 40,
        percentRetained: 5,
        cumulativePercentRetained: 8,
        percentPassing: 92,
      },
      {
        sieveSize: 2.0,
        sieveOpening: "#10",
        massRetained: 45,
        cumulativeMassRetained: 85,
        percentRetained: 9,
        cumulativePercentRetained: 17,
        percentPassing: 83,
      },
      {
        sieveSize: 0.85,
        sieveOpening: "#20",
        massRetained: 65,
        cumulativeMassRetained: 150,
        percentRetained: 13,
        cumulativePercentRetained: 30,
        percentPassing: 70,
      },
      {
        sieveSize: 0.425,
        sieveOpening: "#40",
        massRetained: 75,
        cumulativeMassRetained: 225,
        percentRetained: 15,
        cumulativePercentRetained: 45,
        percentPassing: 55,
      },
      {
        sieveSize: 0.25,
        sieveOpening: "#60",
        massRetained: 50,
        cumulativeMassRetained: 275,
        percentRetained: 10,
        cumulativePercentRetained: 55,
        percentPassing: 45,
      },
      {
        sieveSize: 0.15,
        sieveOpening: "#100",
        massRetained: 75,
        cumulativeMassRetained: 350,
        percentRetained: 15,
        cumulativePercentRetained: 70,
        percentPassing: 30,
      },
      {
        sieveSize: 0.075,
        sieveOpening: "#200",
        massRetained: 100,
        cumulativeMassRetained: 450,
        percentRetained: 20,
        cumulativePercentRetained: 90,
        percentPassing: 10,
      },
    ],
    hydrometerData: [
      { time: 2, particleSize: 0.05, percentFiner: 8 },
      { time: 5, particleSize: 0.032, percentFiner: 6 },
      { time: 15, particleSize: 0.018, percentFiner: 4 },
      { time: 30, particleSize: 0.013, percentFiner: 3 },
      { time: 60, particleSize: 0.009, percentFiner: 2 },
      { time: 250, particleSize: 0.005, percentFiner: 1 },
    ],
  },
  {
    id: "sample-2",
    name: "Sample B",
    location: "Borehole BH-2",
    depth: "3.0-3.5m",
    specificGravity: 2.68,
    liquidLimit: 35,
    plasticLimit: 18,
    color: CHART_COLORS[1],
    symbol: CHART_SYMBOLS[1],
    sieveData: [
      {
        sieveSize: 19.0,
        sieveOpening: '3/4"',
        massRetained: 5,
        cumulativeMassRetained: 5,
        percentRetained: 1,
        cumulativePercentRetained: 1,
        percentPassing: 99,
      },
      {
        sieveSize: 9.5,
        sieveOpening: '3/8"',
        massRetained: 20,
        cumulativeMassRetained: 25,
        percentRetained: 4,
        cumulativePercentRetained: 5,
        percentPassing: 95,
      },
      {
        sieveSize: 4.75,
        sieveOpening: "#4",
        massRetained: 30,
        cumulativeMassRetained: 55,
        percentRetained: 6,
        cumulativePercentRetained: 11,
        percentPassing: 89,
      },
      {
        sieveSize: 2.0,
        sieveOpening: "#10",
        massRetained: 40,
        cumulativeMassRetained: 95,
        percentRetained: 8,
        cumulativePercentRetained: 19,
        percentPassing: 81,
      },
      {
        sieveSize: 0.85,
        sieveOpening: "#20",
        massRetained: 55,
        cumulativeMassRetained: 150,
        percentRetained: 11,
        cumulativePercentRetained: 30,
        percentPassing: 70,
      },
      {
        sieveSize: 0.425,
        sieveOpening: "#40",
        massRetained: 60,
        cumulativeMassRetained: 210,
        percentRetained: 12,
        cumulativePercentRetained: 42,
        percentPassing: 58,
      },
      {
        sieveSize: 0.25,
        sieveOpening: "#60",
        massRetained: 45,
        cumulativeMassRetained: 255,
        percentRetained: 9,
        cumulativePercentRetained: 51,
        percentPassing: 49,
      },
      {
        sieveSize: 0.15,
        sieveOpening: "#100",
        massRetained: 70,
        cumulativeMassRetained: 325,
        percentRetained: 14,
        cumulativePercentRetained: 65,
        percentPassing: 35,
      },
      {
        sieveSize: 0.075,
        sieveOpening: "#200",
        massRetained: 125,
        cumulativeMassRetained: 450,
        percentRetained: 25,
        cumulativePercentRetained: 90,
        percentPassing: 10,
      },
    ],
    hydrometerData: [
      { time: 2, particleSize: 0.048, percentFiner: 8 },
      { time: 5, particleSize: 0.03, percentFiner: 6 },
      { time: 15, particleSize: 0.017, percentFiner: 4 },
      { time: 30, particleSize: 0.012, percentFiner: 3 },
      { time: 60, particleSize: 0.008, percentFiner: 2 },
      { time: 250, particleSize: 0.004, percentFiner: 1 },
    ],
  },
]

export default function GrainChartPage() {
  const [samples, setSamples] = useState<SampleData[]>([])
  const [showExample, setShowExample] = useState(false)

  const handleLoadExample = () => {
    setSamples(EXAMPLE_SAMPLES)
    setShowExample(true)
  }

  const handleClearData = () => {
    setSamples([])
    setShowExample(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Geotechnical Engineering</h1>
            <p className="mt-2 text-lg text-gray-600">Grain Size Distribution Analysis</p>
          </div>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Chart Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex space-x-4">
              <Button onClick={handleLoadExample} variant={showExample ? "secondary" : "default"}>
                Load Example Data
              </Button>
              <Button onClick={handleClearData} variant="outline" disabled={samples.length === 0}>
                Clear Data
              </Button>
            </CardContent>
          </Card>

          {/* Chart */}
          <GrainSizeDistributionChart samples={samples} className="print:shadow-none" />

          {/* Instructions */}
          {samples.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  This is a professional grain size distribution chart component designed for geotechnical engineering
                  applications. To use:
                </p>
                <ol>
                  <li>Load your sample data using the controls above</li>
                  <li>The chart will display both sieve and hydrometer analysis results</li>
                  <li>Export the chart as PNG for presentations or PDF for formal reports</li>
                </ol>
                <p>
                  The chart supports up to 10 samples with unique colors and symbols, following ASTM/USCS standards for
                  grain size distribution plots.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
