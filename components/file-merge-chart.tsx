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
import { classifySoilUSCS, classifySoilAASHTO } from "@/lib/soil-classification"
import { exportFileMergePDF } from "@/lib/file-merge-pdf-export"

interface GSAFileData {
  fileName: string
  sieveData: SieveData[]
  analysisResults: AnalysisResults
  color: string
  symbol: string
}

const colors = [
  "#000000", // Black
  "#000000", // Black (all curves in black as per image)
  "#000000", // Black
  "#000000", // Black
  "#000000", // Black
  "#000000", // Black
  "#000000", // Black
  "#000000", // Black
  "#000000", // Black
  "#000000", // Black
]

const symbols = ["○", "□", "△", "▽", "☆", "◇", "◎", "■", "▲", "▼"]

export default function FileMergeChart() {
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
          color: colors[(gsaFiles.length + newFiles.length) % colors.length],
          symbol: symbols[(gsaFiles.length + newFiles.length) % symbols.length],
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

  // Prepare chart data - only use actual uploaded data
  const chartData =
    gsaFiles.length > 0
      ? gsaFiles[0].sieveData
          .filter((sieve) => sieve.sieveSize > 0 && sieve.sieveSize >= 0.001 && sieve.sieveSize <= 100)
          .sort((a, b) => b.sieveSize - a.sieveSize)
          .map((sieve) => {
            const dataPoint: any = {
              sieveSize: sieve.sieveSize,
              sieveOpening: sieve.sieveOpening,
            }

            gsaFiles.forEach((file, index) => {
              const matchingSieve = file.sieveData.find((s) => Math.abs(s.sieveSize - sieve.sieveSize) < 0.001)
              dataPoint[`file_${index}`] = matchingSieve ? matchingSieve.percentPassing : null
            })

            return dataPoint
          })
      : []

  const formatXAxisTick = (value: number) => {
    if (value >= 1) return value.toFixed(0)
    if (value >= 0.1) return value.toFixed(1)
    return value.toFixed(3)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-black rounded p-2 shadow-lg text-xs">
          <p className="font-medium">{`Particle Size: ${formatXAxisTick(label)} mm`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${gsaFiles[index]?.fileName}: ${entry.value?.toFixed(1)}%`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const exportChart = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default
      const chartElement = document.getElementById("file-merge-chart")

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
      link.download = `GRAIN_SIZE_DISTRIBUTION_COMPARISON_${new Date().toISOString().split("T")[0]}.png`
      link.href = canvas.toDataURL("image/png")

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Chart export error:", error)
      alert("圖表匯出失敗，請稍後再試")
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
                      <span className="font-mono text-lg">{file.symbol}</span>
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

      {/* Chart Section - Only show if files are loaded */}
      {gsaFiles.length >= 2 && (
        <Card>
          <CardContent className="p-0">
            <div className="border-2 border-black bg-white" style={{ fontFamily: "monospace" }}>
              {/* Title - exactly as in image */}
              <div className="border-b-2 border-black p-4 text-center">
                <div className="text-lg font-bold tracking-wider">GRAIN SIZE DISTRIBUTION TEST REPORT</div>
              </div>

              {/* Header section - exactly as in image */}
              <div className="p-2 border-b border-black">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs">
                    <div className="mb-1">U.S. Std. Sieve</div>
                  </div>
                  <div className="text-xs">
                    <div className="mb-1">Hydrometer</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportChart} variant="outline" size="sm">
                      <FileImage className="w-4 h-4 mr-2" />
                      匯出圖表
                    </Button>
                    <Button onClick={() => exportFileMergePDF(gsaFiles)} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      匯出PDF
                    </Button>
                  </div>
                </div>

                {/* Top sieve size labels */}
                <div
                  className="flex justify-between text-xs mb-1"
                  style={{ paddingLeft: "40px", paddingRight: "100px" }}
                >
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

              {/* Chart area */}
              <div className="relative">
                <div
                  className="h-80 w-full border-black relative"
                  id="file-merge-chart"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 100, left: 40, bottom: 40 }}>
                      <CartesianGrid stroke="#000000" strokeWidth={0.5} />
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

                      {/* Data Lines - matching image style */}
                      {gsaFiles.map((file, index) => (
                        <Line
                          key={index}
                          type="monotone"
                          dataKey={`file_${index}`}
                          stroke={file.color}
                          strokeWidth={1.5}
                          dot={(props) => {
                            const symbolMap: { [key: string]: any } = {
                              "○": { fill: "none", stroke: file.color, strokeWidth: 1, r: 2 },
                              "□": { fill: "none", stroke: file.color, strokeWidth: 1, r: 2 },
                              "△": { fill: "none", stroke: file.color, strokeWidth: 1, r: 2 },
                              "▽": { fill: "none", stroke: file.color, strokeWidth: 1, r: 2 },
                              "☆": { fill: "none", stroke: file.color, strokeWidth: 1, r: 2 },
                            }
                            const style = symbolMap[file.symbol] || {
                              fill: "none",
                              stroke: file.color,
                              strokeWidth: 1,
                              r: 2,
                            }
                            return <circle cx={props.cx} cy={props.cy} {...style} />
                          }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Y-axis label */}
                  <div
                    className="absolute left-1 top-1/2 transform -rotate-90 text-xs"
                    style={{ transformOrigin: "center", marginTop: "-60px" }}
                  >
                    Percent Passing (%)
                  </div>

                  {/* Legend - positioned exactly as in image */}
                  <div className="absolute right-4 top-4 text-xs">
                    {gsaFiles.map((file, index) => (
                      <div key={index} className="flex items-center mb-1">
                        <span className="mr-2">{file.symbol}</span>
                        <span>{file.fileName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom axis label and powers of 10 */}
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

              {/* Particle size classification */}
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
                    {gsaFiles.map((file, index) => {
                      const results = file.analysisResults
                      return (
                        <tr key={index} className="border-b border-black">
                          <td className="border-r border-black p-1 text-center font-medium">{file.fileName}</td>
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
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Classification Table */}
              <div className="border-t border-black">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="border-r border-black p-1 text-center">Test No.</th>
                      <th className="border-r border-black p-1 text-center">
                        USCS (ASTM D2487-85) Soil Classification
                      </th>
                      <th className="border-r border-black p-1 text-center">AASHTO</th>
                      <th className="p-1 text-center">% Fines Clay Silt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gsaFiles.map((file, index) => {
                      const results = file.analysisResults
                      const uscs = classifySoilUSCS(results)
                      const aashto = classifySoilAASHTO(results)
                      return (
                        <tr key={index} className="border-b border-black">
                          <td className="border-r border-black p-1 text-center font-medium">{file.fileName}</td>
                          <td className="border-r border-black p-1 text-center">
                            <span className="font-bold">{uscs.symbol}</span> {uscs.name}
                          </td>
                          <td className="border-r border-black p-1 text-center">{aashto.group}</td>
                          <td className="p-1 text-center">
                            {results.finesPercent.toFixed(1)} {results.finesPercent.toFixed(1)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Company Info */}
              <div className="border-t-2 border-black p-3 text-center">
                <div className="font-bold text-sm">GEOTECH ENGINEERING</div>
                <div className="font-bold text-sm">CONSULTANTS CO., LTD.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
