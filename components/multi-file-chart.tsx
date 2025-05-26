"use client"

import { useRef } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

import type { SieveData, AnalysisResults } from "@/types/sieve-analysis"

interface GSAFileData {
  fileName: string
  sieveData: SieveData[]
  analysisResults: AnalysisResults
  color: string
  symbol: string
}

interface MultiFileChartProps {
  files: GSAFileData[]
}

export default function MultiFileChart({ files }: MultiFileChartProps) {
  const chartRef = useRef(null)

  const exportPDF = async () => {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current)
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("landscape", "mm", "a4")
    pdf.addImage(imgData, "PNG", 10, 10, 270, 180)
    pdf.save(`grain-size-multifile.pdf`)
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Multi-File Grain Size Comparison</h2>
        <Button onClick={exportPDF}>匯出 PDF</Button>
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={420}>
          <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="diameter"
              scale="log"
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
            {files.map((file, index) => (
              <Line
                key={index}
                data={file.sieveData.map(item => ({
                  diameter: item.diameter,
                  percentPassing: item.percentPassing
                }))}
                name={file.fileName}
                type="monotone"
                dataKey="percentPassing"
                stroke={file.color}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
