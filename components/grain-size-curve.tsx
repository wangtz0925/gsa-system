"use client"

import { useMemo, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"
import { Button } from "@/components/ui/button"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface GrainSizeCurveProps {
  data: SieveData[]
  results: AnalysisResults
  sampleInfo: { sampleId: string; fileName: string }
  temperatureData?: TemperatureData | null
}

export default function GrainSizeCurve({ data, results, sampleInfo, temperatureData }: GrainSizeCurveProps) {
  const chartRef = useRef(null)

  const chartData = useMemo(() => {
    return data.map(item => ({
      diameter: item.diameter,
      percentPassing: item.percentPassing
    }))
  }, [data])

  const exportPDF = async () => {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current)
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("landscape", "mm", "a4")
    pdf.addImage(imgData, "PNG", 10, 10, 270, 180)
    pdf.save(`grain-size-${sampleInfo.sampleId}.pdf`)
  }

  return (
    <Card className="p-4">
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Grain Size Distribution Curve</h2>
          <Button onClick={exportPDF}>匯出 PDF</Button>
        </div>
        <div className="text-sm mb-4">
          <p>Sample ID: {sampleInfo.sampleId}</p>
          <p>File: {sampleInfo.fileName}</p>
          {temperatureData && <p>Temperature: {temperatureData.temperature} °C</p>}
        </div>
        <div ref={chartRef} className="bg-white p-4">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="diameter"
                scale="log"
                type="number"
                domain={[0.001, 100]}
                tickFormatter={(val) => `10^${Math.log10(val).toFixed(0)}`}
                label={{ value: "Diameter (mm)", position: "insideBottom", offset: -10 }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                label={{ value: "Percent Passing by Weight", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Legend verticalAlign="top" align="right" />
              <Line type="monotone" dataKey="percentPassing" stroke="#007bff" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
