"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SieveData, AnalysisResults } from "@/types/sieve-analysis"
import { Button } from "@/components/ui/button"
import { FileImage } from "lucide-react"
import { exportChartAsPNG } from "@/lib/chart-export"

interface GrainSizeCurveProps {
  data: SieveData[]
  results: AnalysisResults
  sampleInfo: { sampleId: string }
}

export default function GrainSizeCurve({ data, results, sampleInfo }: GrainSizeCurveProps) {
  const chartData = useMemo(() => {
    return data
      .filter((sieve) => sieve.sieveSize > 0)
      .sort((a, b) => b.sieveSize - a.sieveSize)
      .map((sieve) => ({
        sieveSize: sieve.sieveSize,
        percentPassing: sieve.percentPassing,
        logSize: Math.log10(sieve.sieveSize),
      }))
  }, [data])

  const formatXAxisTick = (value: number) => {
    if (value >= 1) return value.toFixed(0)
    if (value >= 0.1) return value.toFixed(1)
    return value.toFixed(3)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`篩網尺寸: ${formatXAxisTick(label)} mm`}</p>
          <p className="text-blue-600">{`通過百分比: ${payload[0].value.toFixed(1)}%`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Grain Size Distribution Curve */}
      <Card>
        <CardHeader>
          <CardTitle>顆粒粒徑分布曲線</CardTitle>
          <CardDescription>半對數圖表顯示通過百分比與顆粒粒徑關係</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full" id="grain-size-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="sieveSize"
                  scale="log"
                  domain={["dataMin", "dataMax"]}
                  type="number"
                  tickFormatter={formatXAxisTick}
                  label={{ value: "顆粒粒徑 (mm)", position: "insideBottom", offset: -10 }}
                />
                <YAxis domain={[0, 100]} label={{ value: "通過百分比 (%)", angle: -90, position: "insideLeft" }} />
                <Tooltip content={<CustomTooltip />} />

                {/* Reference lines for D10, D30, D60 */}
                <ReferenceLine x={results.d10} stroke="#ef4444" strokeDasharray="5 5" />
                <ReferenceLine x={results.d30} stroke="#f97316" strokeDasharray="5 5" />
                <ReferenceLine x={results.d60} stroke="#eab308" strokeDasharray="5 5" />

                {/* Horizontal reference lines */}
                <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="2 2" />
                <ReferenceLine y={30} stroke="#f97316" strokeDasharray="2 2" />
                <ReferenceLine y={60} stroke="#eab308" strokeDasharray="2 2" />

                <Line
                  type="monotone"
                  dataKey="percentPassing"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => exportChartAsPNG("grain-size-chart", sampleInfo.sampleId)}
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

      {/* Gradation Analysis */}
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
