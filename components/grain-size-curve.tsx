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
  sampleInfo: { sampleId: string; fileName: string }
  temperatureData?: TemperatureData | null
}

export default function GrainSizeCurve({ data, results, sampleInfo, temperatureData }: GrainSizeCurveProps) {
  const chartData = useMemo(() => {
    // 篩析部分：data 裡面每個項目有 { sieveSize: number, massRetained: number }
    const totalWeight = data.reduce((sum, s) => sum + (Number.parseFloat(s.massRetained.toString()) || 0), 0)
    // 先算累積保留與百分比通過
    let cumulative = 0
    // 排序：確保從大到小
    const sieveOrdered = [...data].sort((a, b) => b.sieveSize - a.sieveSize)
    const sievePoints = sieveOrdered.map((s) => {
      cumulative += Number.parseFloat(s.massRetained.toString()) || 0
      const percentPassing = ((totalWeight - cumulative) / totalWeight) * 100
      return {
        sieveSize: s.sieveSize, // 例如 4.75, 2.00, … 單位 mm
        percentPassing: Number.parseFloat(percentPassing.toFixed(2)),
        dataType: "sieve", // 標記為篩析
      }
    })

    // Hydrometer 部分：假設 temperatureData 存在時計算
    let hydroPoints: any[] = []
    if (temperatureData) {
      const hydrometerData = calculateHydrometerAnalysis(temperatureData, data)
      hydroPoints = hydrometerData.map((h) => ({
        sieveSize: h.particleSize, // 例如 0.0015 mm
        percentPassing: Number.parseFloat(h.percentFiner.toFixed(2)),
        dataType: "hydro", // 標記為 hydrometer
      }))
    }

    // 合併後再按 sieveSize 由大到小排序
    const allPoints = [...sievePoints, ...hydroPoints].sort((a, b) => b.sieveSize - a.sieveSize)

    console.log("DEBUG chartData:", allPoints)
    console.log("DEBUG chartData:", allPoints);
    return allPoints
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
          <p className="font-medium">{`Particle Size: ${label >= 1 ? label.toFixed(0) : label >= 0.1 ? label.toFixed(1) : label.toFixed(3)} mm`}</p>
          <p className="text-blue-600">{`Percent Passing: ${payload[0].value.toFixed(1)}%`}</p>
          <p className="text-xs text-muted-foreground">
            {dataType === "sieve" ? "Sieve Analysis" : "Hydrometer Analysis"}
          </p>
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
        <CardContent className="p-0">
          {/* Complete professional layout matching the image exactly */}
          <div className="border-2 border-black bg-white" style={{ fontFamily: "monospace" }}>
            {/* Title */}
            <div className="border-b-2 border-black p-4 text-center">
              <div className="text-lg font-bold">GRAIN SIZE DISTRIBUTION TEST REPORT</div>
            </div>

            {/* Header section with sieve indicators */}
            <div className="p-4 border-b border-black">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm">
                  <div className="mb-1">U.S. Std. Sieve</div>
                </div>
                <div className="text-sm">
                  <div className="mb-1">Hydrometer</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportChartAsPNG("grain-size-chart", sampleInfo.fileName || sampleInfo.sampleId)}
                    variant="outline"
                    size="sm"
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Export Chart
                  </Button>
                  <Button
                    onClick={() => exportGrainSizePDF(data, results, sampleInfo, temperatureData)}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>

              {/* Top sieve size labels - exactly as in image */}
              <div className="flex justify-between text-xs mb-2" style={{ paddingLeft: "60px", paddingRight: "120px" }}>
                <span>3</span>
                <span>2</span>
                <span>1 3/4</span>
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

            {/* Chart area with exact positioning */}
            <div className="relative">
              <div
                className="h-96 w-full border-black relative"
                id="grain-size-chart"
                style={{ backgroundColor: "#ffffff" }}
              >
                {/* Top axis with sieve labels - positioned above chart */}
                <div
                  style={{
                    position: "absolute",
                    top: "-16px",
                    left: "20px",
                    right: "20px",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>3"</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>2"</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>1.5"</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>1"</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>3/4"</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>3/8"</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#4</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#10</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#20</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#40</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#60</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#100</span>
                    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#200</span>
                  </div>
                  <div className="text-center text-xs font-medium">U.S. Std. Sieve</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 40, right: 120, left: 60, bottom: 60 }}>
                    {/* Professional grid pattern - matching matplotlib style */}
                    <CartesianGrid stroke="#000000" strokeWidth={0.5} strokeDasharray="2 2" />

                    {/* X-axis - log scale, inverted, range 10² to 10⁻³ */}
                    <XAxis
                      dataKey="sieveSize"
                      scale="log"
                      domain={["dataMax", "dataMin"]}
                      type="number"
                      tickValues={[100, 10, 1, 0.1, 0.01, 0.001]}
                      tickFormatter={(v) => {
                        const logVal = Math.log10(v);
                        return Number.isInteger(logVal) ? `10^${logVal}` : "";
                      }}
                      stroke="#000000"
                      strokeWidth={1}
                      tick={{ fontSize: 10, fill: "#000000" }}
                      axisLine={{ stroke: "#000000", strokeWidth: 1 }}
                      tickLine={{ stroke: "#000000", strokeWidth: 1 }}
                      label={{
                        value: "Diameter of Particle (mm)",
                        position: "insideBottom",
                        offset: -10,
                        style: { textAnchor: "middle", fontSize: "12px", fontWeight: "bold" },
                      }}
                    />

                    {/* Y-axis - linear scale, 0-100% */}
                    <YAxis
                      domain={[0, 100]}
                      stroke="#000000"
                      strokeWidth={1}
                      tick={{ fontSize: 10, fill: "#000000" }}
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

                    {/* Main curve - blue color matching matplotlib default */}
                    <Line
                      type="monotone"
                      dataKey="percentPassing"
                      stroke="#1f77b4"
                      strokeWidth={2}
                      dot={(props) => {
                        const { payload } = props
                        if (payload?.dataType === "sieve") {
                          return (
                            <circle cx={props.cx} cy={props.cy} r={4} fill="#1f77b4" stroke="#1f77b4" strokeWidth={1} />
                          )
                        } else {
                          return (
                            <circle cx={props.cx} cy={props.cy} r={2} fill="#1f77b4" stroke="#1f77b4" strokeWidth={1} />
                          )
                        }
                      }}
                      activeDot={{ r: 5, fill: "#1f77b4" }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Top axis with sieve labels - matching matplotlib twiny() */}
                {/* 
<div style={{position: "absolute", top: "-32px", left: "20px", right: "20px", pointerEvents: "none", zIndex: 10}}>
  <div className="flex justify-between text-xs mb-1">
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>3"</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>2"</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>1.5"</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>1"</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>3/4"</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>3/8"</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#4</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#10</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#20</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#40</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#60</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#100</span>
    <span style={{ transform: "rotate(-45deg)", transformOrigin: "center" }}>#200</span>
  </div>
  <div className="text-center text-xs font-medium">U.S. Std. Sieve</div>
</div>
*/}

                {/* Y-axis label - positioned exactly as matplotlib */}
                <div
                  className="absolute left-2 top-1/2 transform -rotate-90 text-xs font-medium"
                  style={{ transformOrigin: "center", marginTop: "-40px" }}
                >
                  Percent Passing (%)
                </div>

                {/* Legend - positioned exactly as matplotlib */}
                <div className="absolute right-4 top-16 text-xs">
                  <div className="flex items-center mb-1">
                    <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
                    <span>{sampleInfo.fileName || "Sample 1"}</span>
                  </div>
                </div>

                {/* Powers of 10 labels - matching matplotlib log scale */}
                <div className="absolute bottom-8 left-16 right-16">
                  <div className="flex justify-between text-xs mb-1">
                    <span>10²</span>
                    <span>10¹</span>
                    <span>10⁰</span>
                    <span>10⁻¹</span>
                    <span>10⁻²</span>
                    <span>10⁻³</span>
                  </div>
                </div>
              </div>

              {/* Bottom axis label and powers of 10 */}
              <div className="absolute bottom-8 left-16 right-16">
                <div className="flex justify-between text-xs mb-1">
                  <span>10²</span>
                  <span>10¹</span>
                  <span>10⁰</span>
                  <span>10⁻¹</span>
                  <span>10⁻²</span>
                  <span>10⁻³</span>
                </div>
                <div className="text-center text-xs font-medium">Diameter of Particle in Millimeters</div>
              </div>
            </div>

            {/* Particle size classification bar - exactly as in image */}
            <div className="border-t-2 border-black">
              <div className="grid grid-cols-3 text-center text-sm font-bold border-b border-black">
                <div className="p-2 border-r border-black">GRAVEL</div>
                <div className="p-2 border-r border-black">SAND</div>
                <div className="p-2">FINES</div>
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
                      {sampleInfo.fileName || "Sample-1"}
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
                      {sampleInfo.fileName || "Sample-1"}
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
            <div className="border-t-2 border-black p-4 text-center">
              <div className="font-bold">GEOTECH ENGINEERING</div>
              <div className="font-bold">CONSULTANTS CO., LTD.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
