"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileImage, FileText } from "lucide-react"
import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"
import { calculateHydrometerAnalysis } from "@/lib/hydrometer-calculations"

interface ProfessionalGrainSizeChartProps {
  data: SieveData[]
  results: AnalysisResults
  sampleInfo: {
    sampleId?: string
    fileName?: string
    location?: string
    depth?: string
    specificGravity?: string
    liquidLimit?: string
    plasticLimit?: string
  }
  temperatureData?: TemperatureData | null
  title?: string
}

const CHART_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
]
const CHART_SYMBOLS = ["○", "□", "△", "▽", "☆", "◇", "◎", "■", "▲", "▼"]

export default function ProfessionalGrainSizeChart({
  data,
  results,
  sampleInfo,
  temperatureData,
  title = "Grain Size Distribution Curve",
}: ProfessionalGrainSizeChartProps) {
  const chartData = useMemo(() => {
    // Sieve analysis data
    const sievePoints = data
      .filter((sieve) => sieve.sieveSize > 0 && sieve.percentPassing !== undefined)
      .sort((a, b) => b.sieveSize - a.sieveSize)
      .map((sieve) => ({
        particleSize: sieve.sieveSize,
        percentPassing: sieve.percentPassing,
        dataType: "sieve",
      }))

    // Hydrometer analysis data
    let hydrometerPoints: any[] = []
    if (temperatureData) {
      const hydrometerData = calculateHydrometerAnalysis(temperatureData, data)
      hydrometerPoints = hydrometerData
        .filter((point) => point.particleSize > 0 && point.percentFiner !== undefined)
        .map((point) => ({
          particleSize: point.particleSize,
          percentPassing: point.percentFiner,
          dataType: "hydrometer",
        }))
    }

    // Combine and sort all data points
    return [...sievePoints, ...hydrometerPoints]
      .filter((point) => point.particleSize >= 0.001 && point.particleSize <= 100)
      .sort((a, b) => b.particleSize - a.particleSize)
  }, [data, temperatureData])

  const formatXAxisTick = (value: number) => {
    const power = Math.log10(value)
    if (power >= 0) {
      return `10${power === 0 ? "⁰" : power === 1 ? "¹" : "²"}`
    } else {
      const abspower = Math.abs(power)
      return `10${abspower === 1 ? "⁻¹" : abspower === 2 ? "⁻²" : "⁻³"}`
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataType = payload[0].payload.dataType
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">
            Particle Size: {label >= 1 ? label.toFixed(0) : label >= 0.1 ? label.toFixed(1) : label.toFixed(3)} mm
          </p>
          <p className="text-blue-600">Percent Passing: {payload[0].value.toFixed(1)}%</p>
          <p className="text-gray-500 text-sm">{dataType === "sieve" ? "Sieve Analysis" : "Hydrometer Analysis"}</p>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload?.dataType === "sieve") {
      return <circle cx={cx} cy={cy} r={3} fill="none" stroke="#1f77b4" strokeWidth={1.5} />
    } else {
      return <circle cx={cx} cy={cy} r={2} fill="#1f77b4" stroke="#1f77b4" strokeWidth={1} />
    }
  }

  const handleExportPNG = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default
      const element = document.getElementById("professional-grain-size-chart")

      if (!element) {
        alert("Chart element not found")
        return
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      const link = document.createElement("a")
      link.download = `grain-size-distribution-${sampleInfo.fileName || "sample"}.png`
      link.href = canvas.toDataURL("image/png")

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("PNG export failed:", error)
      alert("PNG export failed. Please try again.")
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch("/api/export-grain-size-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sampleInfo,
          chartData,
          results,
        }),
      })

      if (!response.ok) {
        throw new Error("PDF generation failed")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `grain-size-distribution-${sampleInfo.fileName || "sample"}.pdf`
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("PDF export failed:", error)
      alert("PDF export failed. Please try again.")
    }
  }

  return (
    <Card className="w-full print:shadow-none" id="professional-grain-size-chart">
      <CardHeader className="text-center space-y-4 print:space-y-2">
        <CardTitle className="text-2xl font-bold text-gray-900 print:text-xl">{title}</CardTitle>

        {/* Sample metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm print:text-xs print:gap-2">
          <CardDescription className="text-left space-y-1">
            <div className="font-semibold text-gray-900">
              Sample: {sampleInfo.fileName || sampleInfo.sampleId || "Unknown"}
            </div>
            {sampleInfo.location && <div>Location: {sampleInfo.location}</div>}
            {sampleInfo.depth && <div>Depth: {sampleInfo.depth}</div>}
          </CardDescription>

          <CardDescription className="text-left space-y-1">
            {sampleInfo.specificGravity && <div>Specific Gravity (Gs): {sampleInfo.specificGravity}</div>}
            {sampleInfo.liquidLimit && <div>Liquid Limit (LL): {sampleInfo.liquidLimit}%</div>}
            {sampleInfo.plasticLimit && <div>Plastic Limit (PL): {sampleInfo.plasticLimit}%</div>}
          </CardDescription>

          <CardDescription className="text-left space-y-1">
            <div>D₁₀: {results.d10.toFixed(3)} mm</div>
            <div>D₃₀: {results.d30.toFixed(3)} mm</div>
            <div>D₆₀: {results.d60.toFixed(3)} mm</div>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 print:space-y-4">
        {/* Chart */}
        <div className="h-96 w-full print:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 80, left: 60, bottom: 60 }}>
              {/* Professional grid pattern */}
              <CartesianGrid stroke="#e5e7eb" strokeWidth={0.5} />

              {/* X-axis - logarithmic scale */}
              <XAxis
                dataKey="particleSize"
                scale="log"
                domain={[0.001, 100]}
                type="number"
                ticks={[100, 10, 1, 0.1, 0.01, 0.001]}
                tickFormatter={formatXAxisTick}
                stroke="#374151"
                strokeWidth={1}
                tick={{ fontSize: 12, fill: "#374151" }}
                axisLine={{ stroke: "#374151", strokeWidth: 1 }}
                tickLine={{ stroke: "#374151", strokeWidth: 1 }}
                label={{
                  value: "Particle Size (mm)",
                  position: "insideBottom",
                  offset: -10,
                  style: { textAnchor: "middle", fontSize: "14px", fontWeight: "bold" },
                }}
              />

              {/* Y-axis - linear scale */}
              <YAxis
                domain={[0, 100]}
                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                stroke="#374151"
                strokeWidth={1}
                tick={{ fontSize: 12, fill: "#374151" }}
                axisLine={{ stroke: "#374151", strokeWidth: 1 }}
                tickLine={{ stroke: "#374151", strokeWidth: 1 }}
                label={{
                  value: "Percent Passing (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fontSize: "14px", fontWeight: "bold" },
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Main curve */}
              <Line
                type="monotone"
                dataKey="percentPassing"
                stroke="#1f77b4"
                strokeWidth={2}
                dot={<CustomDot />}
                connectNulls={false}
                activeDot={{ r: 4, fill: "#1f77b4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border">
          <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-sm border border-blue-600 bg-blue-600" />
              <span className="text-lg font-mono text-blue-600">○</span>
              <span className="text-sm font-medium text-gray-700">
                {sampleInfo.fileName || sampleInfo.sampleId || "Sample"}
              </span>
            </div>
            <div className="text-xs text-gray-500">○ Sieve Analysis • ● Hydrometer Analysis</div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex justify-center space-x-4 pt-4 border-t print:hidden">
          <Button onClick={handleExportPNG} variant="outline" className="flex items-center space-x-2">
            <FileImage className="w-4 h-4" />
            <span>Export as PNG</span>
          </Button>

          <Button onClick={handleExportPDF} variant="outline" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Export as PDF</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
