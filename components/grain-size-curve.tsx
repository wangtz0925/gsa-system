"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"
import { Button } from "@/components/ui/button"
import { FileImage } from "lucide-react"
import { exportChartAsPNG } from "@/lib/chart-export"
import { calculateHydrometerAnalysis } from "@/lib/hydrometer-calculations"

interface GrainSizeCurveProps {
  data: SieveData[]
  results: AnalysisResults
  sampleInfo: { sampleId: string; fileName: string }
  temperatureData?: TemperatureData | null
}

export default function GrainSizeCurve({ data, results, sampleInfo, temperatureData }: GrainSizeCurveProps) {
  const chartData = useMemo(() => {
    // Sieve analysis data
    const sievePoints = data
      .filter((sieve) => sieve.sieveSize > 0)
      .sort((a, b) => b.sieveSize - a.sieveSize)
      .map((sieve) => ({
        sieveSize: sieve.sieveSize,
        percentPassing: sieve.percentPassing,
        logSize: Math.log10(sieve.sieveSize),
        dataType: "sieve",
      }))

    // Hydrometer analysis data
    let hydrometerPoints: any[] = []
    if (temperatureData) {
      const hydrometerData = calculateHydrometerAnalysis(temperatureData, data)
      hydrometerPoints = hydrometerData.map((point) => ({
        sieveSize: point.particleSize,
        percentPassing: point.percentFiner,
        logSize: Math.log10(point.particleSize),
        dataType: "hydrometer",
      }))
    }

    // Combine and sort all data points
    return [...sievePoints, ...hydrometerPoints].sort((a, b) => b.sieveSize - a.sieveSize)
  }, [data, temperatureData])

  const formatXAxisTick = (value: number) => {
    if (value >= 1) return value.toFixed(0)
    if (value >= 0.1) return value.toFixed(1)
    return value.toFixed(3)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataType = payload[0].payload.dataType
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`粒徑: ${formatXAxisTick(label)} mm`}</p>
          <p className="text-blue-600">{`通過百分比: ${payload[0].value.toFixed(1)}%`}</p>
          <p className="text-xs text-muted-foreground">{dataType === "sieve" ? "篩分析" : "比重計分析"}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Professional Grain Size Distribution Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-lg font-bold">GRAIN SIZE DISTRIBUTION TEST REPORT</CardTitle>
          <CardDescription className="text-center">
            {sampleInfo.fileName && `File: ${sampleInfo.fileName}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full border" id="grain-size-chart" style={{ backgroundColor: "#ffffff" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                {/* Professional grid pattern */}
                <CartesianGrid strokeDasharray="1 1" stroke="#000000" strokeWidth={0.5} />

                {/* X-axis with professional styling */}
                <XAxis
                  dataKey="sieveSize"
                  scale="log"
                  domain={[0.001, 100]}
                  type="number"
                  tickFormatter={formatXAxisTick}
                  stroke="#000000"
                  strokeWidth={1}
                  tick={{ fontSize: 10, fill: "#000000" }}
                  label={{
                    value: "Diameter of Particle in Millimeters",
                    position: "insideBottom",
                    offset: -5,
                    style: { textAnchor: "middle", fontSize: "12px", fontWeight: "bold" },
                  }}
                />

                {/* Y-axis with professional styling */}
                <YAxis
                  domain={[0, 100]}
                  stroke="#000000"
                  strokeWidth={1}
                  tick={{ fontSize: 10, fill: "#000000" }}
                  label={{
                    value: "Percent Passing by Weight",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fontSize: "12px", fontWeight: "bold" },
                  }}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Reference lines for particle size boundaries */}
                <ReferenceLine x={4.75} stroke="#000000" strokeWidth={1} strokeDasharray="2 2" />
                <ReferenceLine x={0.075} stroke="#000000" strokeWidth={1} strokeDasharray="2 2" />

                {/* Main curve */}
                <Line
                  type="monotone"
                  dataKey="percentPassing"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={(props) => {
                    const { payload } = props
                    if (payload?.dataType === "sieve") {
                      return (
                        <circle cx={props.cx} cy={props.cy} r={3} fill="#000000" stroke="#000000" strokeWidth={1} />
                      )
                    } else {
                      return (
                        <circle cx={props.cx} cy={props.cy} r={2} fill="#000000" stroke="#000000" strokeWidth={1} />
                      )
                    }
                  }}
                  activeDot={{ r: 4, fill: "#000000" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Particle size classification bar */}
          <div className="mt-4 border border-black">
            <div className="grid grid-cols-3 text-center text-sm font-bold bg-gray-100 border-b border-black">
              <div className="p-2 border-r border-black">GRAVEL</div>
              <div className="p-2 border-r border-black">SAND</div>
              <div className="p-2">FINES</div>
            </div>
            <div className="grid grid-cols-6 text-center text-xs">
              <div className="p-1 border-r border-black">COARSE</div>
              <div className="p-1 border-r border-black">FINE</div>
              <div className="p-1 border-r border-black">COARSE</div>
              <div className="p-1 border-r border-black">MEDIUM</div>
              <div className="p-1 border-r border-black">FINE</div>
              <div className="p-1">SILT | CLAY</div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => exportChartAsPNG("grain-size-chart", sampleInfo.fileName || sampleInfo.sampleId)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileImage className="w-4 h-4" />
              匯出圖表
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">級配分析</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">均勻係數 (Cᵤ)：</span>
              <span className="font-semibold">{results.uniformityCoefficient.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">曲率係數 (Cᶜ)：</span>
              <span className="font-semibold">{results.coefficientOfCurvature.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {results.uniformityCoefficient > 4 &&
                results.uniformityCoefficient < 6 &&
                results.coefficientOfCurvature > 1 &&
                results.coefficientOfCurvature < 3
                  ? "級配良好土壤"
                  : "級配不良土壤"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">顆粒粒徑組成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">礫石 ({">"} 4.75mm)：</span>
              <span className="font-semibold">{results.gravelPercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">砂 (0.075-4.75mm)：</span>
              <span className="font-semibold">{results.sandPercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">細料 ({"<"} 0.075mm)：</span>
              <span className="font-semibold">{results.finesPercent.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
