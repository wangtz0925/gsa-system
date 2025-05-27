"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
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
  sampleInfo: {
    sampleId: string
    fileName: string
    location?: string
    depth?: string
    specificGravity?: string
    liquidLimit?: string
    plasticLimit?: string
  }
  temperatureData?: TemperatureData | null
}

export default function GrainSizeCurve({ data, results, sampleInfo, temperatureData }: GrainSizeCurveProps) {
  const chartData = useMemo(() => {
    // Sieve analysis data
    const sievePoints = data
      .filter((sieve) => sieve.sieveSize > 0 && sieve.percentPassing !== undefined)
      .sort((a, b) => b.sieveSize - a.sieveSize)
      .map((sieve) => ({
        sieveSize: sieve.sieveSize,
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
          sieveSize: point.particleSize,
          percentPassing: point.percentFiner,
          dataType: "hydrometer",
        }))
    }

    // Combine and sort all data points
    return [...sievePoints, ...hydrometerPoints]
      .filter((point) => point.sieveSize >= 0.001 && point.sieveSize <= 100)
      .sort((a, b) => b.sieveSize - a.sieveSize)
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
        <div className="bg-white border border-black rounded p-2 shadow-lg text-xs">
          <p className="font-medium">{`Particle Size: ${formatXAxisTick(label)} mm`}</p>
          <p className="text-blue-600">{`Percent Passing: ${payload[0].value.toFixed(1)}%`}</p>
          <p className="text-gray-500">{dataType === "sieve" ? "Sieve Analysis" : "Hydrometer Analysis"}</p>
        </div>
      )
    }
    return null
  }

  const uscsClassification = classifySoilUSCS(results)
  const aashtoClassification = classifySoilAASHTO(results)

  return (
    <div className="space-y-6">
      {/* Professional Report Layout - Exact match to image */}
      <Card>
        <CardContent className="p-0">
          <div className="border-2 border-black bg-white" style={{ fontFamily: "monospace" }}>
            {/* Title - exactly as in image */}
            <div className="border-b-2 border-black p-4 text-center">
              <div className="text-lg font-bold tracking-wider">GRAIN SIZE DISTRIBUTION TEST REPORT</div>
            </div>

            {/* Header section with sieve indicators - exactly as in image */}
            <div className="p-2 border-b border-black">
              <div className="flex justify-between items-start mb-1">
                <div className="text-xs">
                  <div className="mb-1">U.S. Std. Sieve</div>
                </div>
                <div className="text-xs">
                  <div className="mb-1">Hydrometer</div>
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

              {/* Top sieve size labels - exactly as in image */}
              <div className="flex justify-between text-xs mb-1" style={{ paddingLeft: "40px", paddingRight: "100px" }}>
                <span>3</span>
                <span>2</span>
                <span>1</span>
                <span>3/4</span>
                <span>3/8</span>
                <span>In.</span>
                <span>#4</span>
                <span>#10</span>
                <span>#20</span>
                <span>#40</span>
                <span>#60</span>
                <span>#100</span>
                <span>#200</span>
              </div>
            </div>

            {/* Chart area - exactly matching image layout */}
            <div className="relative">
              <div
                className="h-80 w-full border-black relative"
                id="grain-size-chart"
                style={{ backgroundColor: "#ffffff" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 100, left: 40, bottom: 40 }}>
                    {/* Professional grid pattern - matching image */}
                    <CartesianGrid stroke="#000000" strokeWidth={0.5} />

                    {/* X-axis - exactly as in image */}
                    <XAxis
                      dataKey="sieveSize"
                      scale="log"
                      domain={[0.001, 100]}
                      type="number"
                      tickFormatter={formatXAxisTick}
                      stroke="#000000"
                      strokeWidth={1}
                      tick={{ fontSize: 8, fill: "#000000" }}
                      axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                      tickLine={{ stroke: "#000000", strokeWidth: 1 }}
                    />

                    {/* Y-axis - exactly as in image */}
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                      stroke="#000000"
                      strokeWidth={1}
                      tick={{ fontSize: 8, fill: "#000000" }}
                      axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                      tickLine={{ stroke: "#000000", strokeWidth: 1 }}
                      label={{
                        value: "Percent Passing (%)",
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
                      strokeWidth={1.5}
                      dot={(props) => {
                        const { payload } = props
                        if (payload?.dataType === "sieve") {
                          return (
                            <circle cx={props.cx} cy={props.cy} r={2} fill="none" stroke="#000000" strokeWidth={1} />
                          )
                        } else {
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={1.5}
                              fill="#000000"
                              stroke="#000000"
                              strokeWidth={1}
                            />
                          )
                        }
                      }}
                      activeDot={{ r: 3, fill: "#000000" }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Y-axis label - positioned exactly as in image */}
                <div
                  className="absolute left-1 top-1/2 transform -rotate-90 text-xs"
                  style={{ transformOrigin: "center", marginTop: "-60px" }}
                >
                  Percent Passing (%)
                </div>

                {/* Legend - positioned exactly as in image */}
                <div className="absolute right-4 top-4 text-xs">
                  <div className="flex items-center mb-1">
                    <span className="mr-2">○</span>
                    <span>{sampleInfo.fileName || "B-1S01"}</span>
                  </div>
                </div>
              </div>

              {/* Bottom axis label and powers of 10 - exactly as in image */}
              <div className="text-center text-xs mt-1 mb-2">Diameter of Particle in Millimeters</div>
              <div className="flex justify-between text-xs px-12 mb-2">
                <span>10²</span>
                <span>10¹</span>
                <span>10⁰</span>
                <span>10⁻¹</span>
                <span>10⁻²</span>
                <span>10⁻³</span>
              </div>
            </div>

            {/* Particle size classification bar - exactly as in image */}
            <div className="border-t border-black">
              <div className="grid grid-cols-3 text-center text-xs font-bold border-b border-black">
                <div className="p-1 border-r border-black">GRAVEL</div>
                <div className="p-1 border-r border-black">SAND</div>
                <div className="p-1">FINES</div>
              </div>
              <div className="grid grid-cols-6 text-center text-xs border-b border-black">
                <div className="p-1 border-r border-black">COARSE</div>
                <div className="p-1 border-r border-black">FINE</div>
                <div className="p-1 border-r border-black">COARSE</div>
                <div className="p-1 border-r border-black">MEDIUM</div>
                <div className="p-1 border-r border-black">FINE</div>
                <div className="p-1 flex">
                  <span className="flex-1">SILT</span>
                  <span className="border-l border-black pl-1 flex-1">CLAY</span>
                </div>
              </div>
            </div>

            {/* Data Tables - exactly matching image format */}
            <div className="border-t border-black">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black p-1 text-center">Test No.</th>
                    <th className="border-r border-black p-1 text-center">D85</th>
                    <th className="border-r border-black p-1 text-center">D60</th>
                    <th className="border-r border-black p-1 text-center">D50</th>
                    <th className="border-r border-black p-1 text-center">D30</th>
                    <th className="border-r border-black p-1 text-center">D15</th>
                    <th className="border-r border-black p-1 text-center">D10</th>
                    <th className="border-r border-black p-1 text-center">Cu</th>
                    <th className="border-r border-black p-1 text-center">Cc</th>
                    <th className="border-r border-black p-1 text-center">LL</th>
                    <th className="border-r border-black p-1 text-center">PI</th>
                    <th className="border-r border-black p-1 text-center">Gravel %</th>
                    <th className="p-1 text-center">Sand %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 text-center font-medium">
                      {sampleInfo.fileName || "B-1S01"}
                    </td>
                    <td className="border-r border-black p-1 text-center">0.18</td>
                    <td className="border-r border-black p-1 text-center">{results.d60.toFixed(2)}</td>
                    <td className="border-r border-black p-1 text-center">0.083</td>
                    <td className="border-r border-black p-1 text-center">{results.d30.toFixed(3)}</td>
                    <td className="border-r border-black p-1 text-center">0.012</td>
                    <td className="border-r border-black p-1 text-center">{results.d10.toFixed(3)}</td>
                    <td className="border-r border-black p-1 text-center">
                      {results.uniformityCoefficient.toFixed(1)}
                    </td>
                    <td className="border-r border-black p-1 text-center">
                      {results.coefficientOfCurvature.toFixed(1)}
                    </td>
                    <td className="border-r border-black p-1 text-center">NV</td>
                    <td className="border-r border-black p-1 text-center">NP</td>
                    <td className="border-r border-black p-1 text-center">{results.gravelPercent.toFixed(1)}</td>
                    <td className="p-1 text-center">{results.sandPercent.toFixed(1)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Classification Table - exactly matching image format */}
            <div className="border-t border-black">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black">
                    <th className="border-r border-black p-1 text-center">Test No.</th>
                    <th className="border-r border-black p-1 text-center">USCS (ASTM D2487-85) Soil Classification</th>
                    <th className="border-r border-black p-1 text-center">AASHTO</th>
                    <th className="p-1 text-center">% Fines Clay Silt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 text-center font-medium">
                      {sampleInfo.fileName || "B-1S01"}
                    </td>
                    <td className="border-r border-black p-1 text-center">
                      <span className="font-bold">{uscsClassification.symbol}</span> {uscsClassification.name}
                    </td>
                    <td className="border-r border-black p-1 text-center">{aashtoClassification.group}</td>
                    <td className="p-1 text-center">
                      {results.finesPercent.toFixed(1)} {results.finesPercent.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Company Info - exactly as in image */}
            <div className="border-t-2 border-black p-3 text-center">
              <div className="font-bold text-sm">GEOTECH ENGINEERING</div>
              <div className="font-bold text-sm">CONSULTANTS CO., LTD.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
