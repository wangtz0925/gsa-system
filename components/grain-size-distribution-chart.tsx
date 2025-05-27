"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileImage, FileText } from "lucide-react"
import type { SampleData } from "@/types/grain-size"
import { generateChartData, formatParticleSize } from "@/lib/chart-utils"
import { exportChartAsPNG, exportChartAsPDF } from "@/lib/export-utils"

interface GrainSizeDistributionChartProps {
  samples: SampleData[]
  title?: string
  className?: string
}

export default function GrainSizeDistributionChart({
  samples,
  title = "Grain Size Distribution Curve",
  className = "",
}: GrainSizeDistributionChartProps) {
  const chartData = useMemo(() => generateChartData(samples), [samples])

  const xAxisTicks = [100, 10, 1, 0.1, 0.01, 0.001]
  const yAxisTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

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
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">Particle Size: {formatParticleSize(label)} mm</p>
          {payload.map((entry: any, index: number) => {
            const sample = samples.find((s) => `sample_${s.id}` === entry.dataKey)
            if (sample && entry.value !== null) {
              return (
                <p key={index} style={{ color: entry.color }} className="text-sm">
                  {sample.name}: {entry.value.toFixed(1)}%
                </p>
              )
            }
            return null
          })}
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props
    const sample = samples.find((s) => `sample_${s.id}` === dataKey)

    if (!sample || payload[dataKey] === null || payload[dataKey] === undefined) {
      return null
    }

    const symbolMap: { [key: string]: JSX.Element } = {
      "○": <circle cx={cx} cy={cy} r={3} fill="none" stroke={sample.color} strokeWidth={1.5} />,
      "□": <rect x={cx - 3} y={cy - 3} width={6} height={6} fill="none" stroke={sample.color} strokeWidth={1.5} />,
      "△": (
        <polygon
          points={`${cx},${cy - 3} ${cx - 3},${cy + 2} ${cx + 3},${cy + 2}`}
          fill="none"
          stroke={sample.color}
          strokeWidth={1.5}
        />
      ),
      "▽": (
        <polygon
          points={`${cx},${cy + 3} ${cx - 3},${cy - 2} ${cx + 3},${cy - 2}`}
          fill="none"
          stroke={sample.color}
          strokeWidth={1.5}
        />
      ),
      "☆": (
        <polygon
          points={`${cx},${cy - 3} ${cx - 1},${cy - 1} ${cx - 3},${cy - 1} ${cx - 2},${cy + 1} ${cx - 3},${cy + 3} ${cx},${cy + 2} ${cx + 3},${cy + 3} ${cx + 2},${cy + 1} ${cx + 3},${cy - 1} ${cx + 1},${cy - 1}`}
          fill="none"
          stroke={sample.color}
          strokeWidth={1.5}
        />
      ),
      "◇": (
        <polygon
          points={`${cx},${cy - 3} ${cx + 3},${cy} ${cx},${cy + 3} ${cx - 3},${cy}`}
          fill="none"
          stroke={sample.color}
          strokeWidth={1.5}
        />
      ),
      "◎": (
        <>
          <circle cx={cx} cy={cy} r={3} fill="none" stroke={sample.color} strokeWidth={1.5} />
          <circle cx={cx} cy={cy} r={1.5} fill={sample.color} />
        </>
      ),
      "■": <rect x={cx - 3} y={cy - 3} width={6} height={6} fill={sample.color} />,
      "▲": <polygon points={`${cx},${cy - 3} ${cx - 3},${cy + 2} ${cx + 3},${cy + 2}`} fill={sample.color} />,
      "▼": <polygon points={`${cx},${cy + 3} ${cx - 3},${cy - 2} ${cx + 3},${cy - 2}`} fill={sample.color} />,
    }

    return symbolMap[sample.symbol] || symbolMap["○"]
  }

  const handleExportPNG = () => {
    exportChartAsPNG("grain-size-chart", "grain-size-distribution")
  }

  const handleExportPDF = () => {
    exportChartAsPDF()
  }

  return (
    <Card className={`w-full ${className}`} id="grain-size-chart">
      <CardHeader className="text-center space-y-4">
        <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>

        {samples.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {samples.map((sample) => (
              <CardDescription key={sample.id} className="text-left space-y-1">
                <div className="font-semibold text-gray-900">{sample.name}</div>
                {sample.location && <div>Location: {sample.location}</div>}
                {sample.depth && <div>Depth: {sample.depth}</div>}
                {sample.specificGravity && <div>Gs: {sample.specificGravity}</div>}
                {sample.liquidLimit && <div>LL: {sample.liquidLimit}%</div>}
                {sample.plasticLimit && <div>PL: {sample.plasticLimit}%</div>}
              </CardDescription>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 80, left: 60, bottom: 60 }}>
              <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" strokeWidth={0.5} />

              <XAxis
                dataKey="particleSize"
                scale="log"
                domain={[0.001, 100]}
                type="number"
                ticks={xAxisTicks}
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

              <YAxis
                domain={[0, 100]}
                ticks={yAxisTicks}
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

              {/* Reference lines for major particle size boundaries */}
              <ReferenceLine x={4.75} stroke="#9ca3af" strokeDasharray="2 2" strokeWidth={1} />
              <ReferenceLine x={0.075} stroke="#9ca3af" strokeDasharray="2 2" strokeWidth={1} />

              {samples.map((sample, index) => (
                <Line
                  key={sample.id}
                  type="monotone"
                  dataKey={`sample_${sample.id}`}
                  stroke={sample.color}
                  strokeWidth={2}
                  dot={<CustomDot />}
                  connectNulls={false}
                  activeDot={{ r: 4, fill: sample.color }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        {samples.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {samples.map((sample) => (
                <div key={sample.id} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-sm border"
                      style={{ backgroundColor: sample.color, borderColor: sample.color }}
                    />
                    <span className="text-lg font-mono" style={{ color: sample.color }}>
                      {sample.symbol}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{sample.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex justify-center space-x-4 pt-4 border-t">
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
