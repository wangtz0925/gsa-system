"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"
import { Button } from "@/components/ui/button"
import { FileImage, FileText } from "lucide-react"
import { exportChartAsPNG } from "@/lib/chart-export"
import { calculateHydrometerAnalysis } from "@/lib/hydrometer-calculations"
import { classifySoilUSCS, classifySoilAASHTO } from "@/lib/soil-classification"
import { exportGrainSizePDF } from "@/lib/grain-size-pdf-export"

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

  const uscsClassification = classifySoilUSCS(results)
  const aashtoClassification = classifySoilAASHTO(results)

  return (
    <div className="space-y-6">
      {/* Professional Grain Size Distribution Report */}
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold border-2 border-black p-4">
            GRAIN SIZE DISTRIBUTION TEST REPORT
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sieve size indicators */}
          <div className="mb-4 text-center">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">
                <div className="grid grid-cols-2 gap-8">
                  <div>U.S. Std. Sieve</div>
                  <div>Hydrometer</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => exportChartAsPNG("grain-size-chart", sampleInfo.fileName || sampleInfo.sampleId)}
                  variant="outline"
                  size="sm"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  匯出圖表
                </Button>
                <Button
                  onClick={() => exportGrainSizePDF(data, results, sampleInfo, temperatureData)}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  匯出PDF
                </Button>
              </div>
            </div>
            <div className="text-xs">3" 2" 1 3/4" 3/8" #4 #10 #20 #40 #60 #100 #200</div>
          </div>

          {/* Chart */}
          <div
            className="h-96 w-full border-2 border-black"
            id="grain-size-chart"
            style={{ backgroundColor: "#ffffff" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                {/* Professional grid pattern */}
                <CartesianGrid strokeDasharray="1 1" stroke="#000000" strokeWidth={0.5} />

                {/* X-axis */}
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

                {/* Y-axis */}
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
          <div className="mt-4 border-2 border-black">
            <div className="grid grid-cols-3 text-center text-sm font-bold bg-gray-100 border-b-2 border-black">
              <div className="p-2 border-r-2 border-black">GRAVEL</div>
              <div className="p-2 border-r-2 border-black">SAND</div>
              <div className="p-2">FINES</div>
            </div>
            <div className="grid grid-cols-6 text-center text-xs border-b border-black">
              <div className="p-1 border-r border-black">COARSE</div>
              <div className="p-1 border-r-2 border-black">FINE</div>
              <div className="p-1 border-r border-black">COARSE</div>
              <div className="p-1 border-r border-black">MEDIUM</div>
              <div className="p-1 border-r-2 border-black">FINE</div>
              <div className="p-1">SILT | CLAY</div>
            </div>
          </div>

          {/* Data Table */}
          <div className="mt-6">
            <Table className="border-2 border-black text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="border border-black text-center">Test No.</TableHead>
                  <TableHead className="border border-black text-center">D85</TableHead>
                  <TableHead className="border border-black text-center">D60</TableHead>
                  <TableHead className="border border-black text-center">D50</TableHead>
                  <TableHead className="border border-black text-center">D30</TableHead>
                  <TableHead className="border border-black text-center">D15</TableHead>
                  <TableHead className="border border-black text-center">D10</TableHead>
                  <TableHead className="border border-black text-center">Cu</TableHead>
                  <TableHead className="border border-black text-center">Cc</TableHead>
                  <TableHead className="border border-black text-center">LL</TableHead>
                  <TableHead className="border border-black text-center">PI</TableHead>
                  <TableHead className="border border-black text-center">Gravel %</TableHead>
                  <TableHead className="border border-black text-center">Sand %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border border-black text-center font-medium">
                    {sampleInfo.fileName || "Sample-1"}
                  </TableCell>
                  <TableCell className="border border-black text-center">0.18</TableCell>
                  <TableCell className="border border-black text-center">{results.d60.toFixed(2)}</TableCell>
                  <TableCell className="border border-black text-center">0.083</TableCell>
                  <TableCell className="border border-black text-center">{results.d30.toFixed(3)}</TableCell>
                  <TableCell className="border border-black text-center">0.012</TableCell>
                  <TableCell className="border border-black text-center">{results.d10.toFixed(3)}</TableCell>
                  <TableCell className="border border-black text-center">
                    {results.uniformityCoefficient.toFixed(1)}
                  </TableCell>
                  <TableCell className="border border-black text-center">
                    {results.coefficientOfCurvature.toFixed(1)}
                  </TableCell>
                  <TableCell className="border border-black text-center">NV</TableCell>
                  <TableCell className="border border-black text-center">NP</TableCell>
                  <TableCell className="border border-black text-center">{results.gravelPercent.toFixed(1)}</TableCell>
                  <TableCell className="border border-black text-center">{results.sandPercent.toFixed(1)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Classification Table */}
          <div className="mt-4">
            <Table className="border-2 border-black text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="border border-black text-center">Test No.</TableHead>
                  <TableHead className="border border-black text-center">
                    USCS (ASTM D2487-85) Soil Classification
                  </TableHead>
                  <TableHead className="border border-black text-center">AASHTO</TableHead>
                  <TableHead className="border border-black text-center">% Fines Clay Silt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border border-black text-center font-medium">
                    {sampleInfo.fileName || "Sample-1"}
                  </TableCell>
                  <TableCell className="border border-black text-center">
                    <span className="font-bold">{uscsClassification.symbol}</span> {uscsClassification.name}
                  </TableCell>
                  <TableCell className="border border-black text-center">{aashtoClassification.group}</TableCell>
                  <TableCell className="border border-black text-center">
                    {results.finesPercent.toFixed(1)} {results.finesPercent.toFixed(1)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Company Info */}
          <div className="mt-6 text-center border-2 border-black p-2">
            <div className="font-bold">GEOTECH ENGINEERING</div>
            <div className="font-bold">CONSULTANTS CO., LTD.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
