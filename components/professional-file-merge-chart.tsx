"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FileImage, Trash2, FileText } from "lucide-react"
import type { SieveData, AnalysisResults } from "@/types/sieve-analysis"

interface GSAFileData {
  fileName: string
  sieveData: SieveData[]
  analysisResults: AnalysisResults
  color: string
  symbol: string
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

export default function ProfessionalFileMergeChart() {
  const [gsaFiles, setGsaFiles] = useState<GSAFileData[]>([])
  const [errors, setErrors] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    if (files.length > 10) {
      setErrors("最多只能選擇 10 個檔案")
      return
    }

    if (gsaFiles.length + files.length > 10) {
      setErrors("總共最多只能載入 10 個檔案")
      return
    }

    const newFiles: GSAFileData[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!file.name.endsWith(".gsa")) {
        setErrors(`檔案 ${file.name} 不是 GSA 格式`)
        continue
      }

      try {
        const text = await file.text()
        const gsaData = JSON.parse(text)

        if (!gsaData.sieveData || !Array.isArray(gsaData.sieveData) || !gsaData.analysisResults) {
          setErrors(`檔案 ${file.name} 格式不正確`)
          continue
        }

        newFiles.push({
          fileName: gsaData.fileInfo?.fileName || file.name.replace(".gsa", ""),
          sieveData: gsaData.sieveData,
          analysisResults: gsaData.analysisResults,
          color: CHART_COLORS[(gsaFiles.length + newFiles.length) % CHART_COLORS.length],
          symbol: CHART_SYMBOLS[(gsaFiles.length + newFiles.length) % CHART_SYMBOLS.length],
        })
      } catch (error) {
        setErrors(`無法讀取檔案 ${file.name}`)
        continue
      }
    }

    if (newFiles.length > 0) {
      setGsaFiles((prev) => [...prev, ...newFiles])
      setErrors("")
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setGsaFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setGsaFiles([])
    setErrors("")
  }

  // Prepare chart data
  const chartData =
    gsaFiles.length > 0
      ? gsaFiles[0].sieveData
          .filter((sieve) => sieve.sieveSize > 0 && sieve.sieveSize >= 0.001 && sieve.sieveSize <= 100)
          .sort((a, b) => b.sieveSize - a.sieveSize)
          .map((sieve) => {
            const dataPoint: any = {
              particleSize: sieve.sieveSize,
              sieveOpening: sieve.sieveOpening,
            }

            gsaFiles.forEach((file, index) => {
              const matchingSieve = file.sieveData.find((s) => Math.abs(s.sieveSize - sieve.sieveSize) < 0.001)
              dataPoint[`sample_${index}`] = matchingSieve ? matchingSieve.percentPassing : null
            })

            return dataPoint
          })
      : []

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
          <p className="font-medium text-gray-900">
            Particle Size: {label >= 1 ? label.toFixed(0) : label >= 0.1 ? label.toFixed(1) : label.toFixed(3)} mm
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {gsaFiles[index]?.fileName}: {entry.value?.toFixed(1)}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props
    const sampleIndex = Number.parseInt(dataKey.split("_")[1])
    const sample = gsaFiles[sampleIndex]

    if (!sample || payload[dataKey] === null || payload[dataKey] === undefined) {
      return null
    }

    const symbolMap: { [key: string]: React.JSX.Element } = {
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

  const handleExportPNG = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default
      const chartElement = document.getElementById("professional-file-merge-chart")

      if (!chartElement) {
        alert("找不到圖表元素")
        return
      }

      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const link = document.createElement("a")
      link.download = `grain-size-distribution-comparison-${new Date().toISOString().split("T")[0]}.png`
      link.href = canvas.toDataURL("image/png")

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Chart export error:", error)
      alert("圖表匯出失敗，請稍後再試")
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch("/api/export-file-merge-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gsaFiles,
          chartData,
        }),
      })

      if (!response.ok) {
        throw new Error("PDF generation failed")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `grain-size-distribution-comparison-${new Date().toISOString().split("T")[0]}.pdf`
      link.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("PDF export failed:", error)
      alert("PDF匯出失敗，請稍後再試")
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">檔案合併</CardTitle>
          <CardDescription>選擇 2-10 個 GSA 檔案進行粒徑分布曲線合併比較</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gsa-files">選擇 GSA 檔案 (2-10 個)</Label>
            <Input
              ref={fileInputRef}
              id="gsa-files"
              type="file"
              multiple
              accept=".gsa"
              onChange={handleFileUpload}
              disabled={gsaFiles.length >= 10}
            />
            {errors && <p className="text-red-500 text-sm">{errors}</p>}
          </div>

          {gsaFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>已載入的檔案 ({gsaFiles.length}/10)</Label>
                <Button onClick={clearAllFiles} variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除全部
                </Button>
              </div>
              <div className="space-y-2">
                {gsaFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: file.color }} />
                      <span className="font-mono text-lg" style={{ color: file.color }}>
                        {file.symbol}
                      </span>
                      <span className="font-medium">{file.fileName}</span>
                    </div>
                    <Button onClick={() => removeFile(index)} variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Section */}
      {gsaFiles.length >= 2 && (
        <Card className="w-full print:shadow-none" id="professional-file-merge-chart">
          <CardHeader className="text-center space-y-4 print:space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900 print:text-xl">
              Grain Size Distribution Comparison
            </CardTitle>
            <CardDescription className="text-sm">Comparison of {gsaFiles.length} samples</CardDescription>
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

                  {/* Data Lines */}
                  {gsaFiles.map((file, index) => (
                    <Line
                      key={index}
                      type="monotone"
                      dataKey={`sample_${index}`}
                      stroke={file.color}
                      strokeWidth={2}
                      dot={<CustomDot />}
                      connectNulls={false}
                      activeDot={{ r: 4, fill: file.color }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border">
              <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {gsaFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-sm border"
                        style={{ backgroundColor: file.color, borderColor: file.color }}
                      />
                      <span className="text-lg font-mono" style={{ color: file.color }}>
                        {file.symbol}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{file.fileName}</span>
                  </div>
                ))}
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
      )}
    </div>
  )
}
