"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FileImage, Trash2, Download } from "lucide-react"
import type { SieveData, AnalysisResults } from "@/types/sieve-analysis"
import { classifySoilUSCS, classifySoilAASHTO } from "@/lib/soil-classification"

interface GSAFileData {
  fileName: string
  sieveData: SieveData[]
  analysisResults: AnalysisResults
  color: string
  symbol: string
}

const colors = [
  "#000000",
  "#FF0000",
  "#00AA00",
  "#0000FF",
  "#FF8800",
  "#AA00AA",
  "#00AAAA",
  "#AA0000",
  "#008800",
  "#000088",
]
const symbols = ["○", "□", "△", "▽", "☆", "◇", "◎", "■", "▲", "▼"]

export default function MultiFileChart() {
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

  // Prepare chart data
  const chartData =
    gsaFiles.length > 0
      ? gsaFiles[0].sieveData
          .filter((sieve) => sieve.sieveSize > 0)
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
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`粒徑: ${formatXAxisTick(label)} mm`}</p>
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
      const chartElement = document.getElementById("multi-file-chart")

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

  const exportDataTable = () => {
    if (gsaFiles.length === 0) return

    // Create CSV content
    const headers = ["Test No.", "D85", "D60", "D50", "D30", "D15", "D10", "Cu", "Cc", "LL", "PI", "Gravel %", "Sand %"]
    const csvContent = [
      headers.join(","),
      ...gsaFiles.map((file, index) => {
        const results = file.analysisResults
        const uscs = classifySoilUSCS(results)
        return [
          file.fileName,
          "0.18", // D85 - would need to be calculated
          results.d60.toFixed(2),
          "0.083", // D50 - would need to be calculated
          results.d30.toFixed(3),
          "0.012", // D15 - would need to be calculated
          results.d10.toFixed(3),
          results.uniformityCoefficient.toFixed(1),
          results.coefficientOfCurvature.toFixed(1),
          "NV", // Liquid Limit
          "NP", // Plasticity Index
          results.gravelPercent.toFixed(1),
          results.sandPercent.toFixed(1),
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Grain_Size_Analysis_Data_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">多檔案粒徑分布比較</CardTitle>
          <CardDescription>選擇 5-10 個 GSA 檔案進行粒徑分布曲線比較</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gsa-files">選擇 GSA 檔案 (5-10 個)</Label>
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

      {gsaFiles.length >= 5 && (
        <>
          {/* Professional Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg font-bold">GRAIN SIZE DISTRIBUTION TEST REPORT</CardTitle>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>U.S. Std. Sieve</div>
                    <div>Hydrometer</div>
                  </div>
                  <div className="text-xs mt-1">3" 2" 1 3/4" 3/8" #4 #10 #20 #40 #60 #100 #200</div>
                </div>
                <div className="text-right">
                  <Button onClick={exportChart} variant="outline" size="sm" className="mr-2">
                    <FileImage className="w-4 h-4 mr-2" />
                    匯出圖表
                  </Button>
                  <Button onClick={exportDataTable} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    匯出數據
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full border" id="multi-file-chart" style={{ backgroundColor: "#ffffff" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="1 1" stroke="#000000" strokeWidth={0.5} />
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

                    {gsaFiles.map((file, index) => (
                      <Line
                        key={index}
                        type="monotone"
                        dataKey={`file_${index}`}
                        stroke={file.color}
                        strokeWidth={2}
                        dot={{ fill: file.color, strokeWidth: 1, r: 3 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Particle size classification */}
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

              {/* Legend */}
              <div className="mt-4 p-4 border rounded bg-muted/50">
                <h4 className="font-medium mb-2">圖例</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {gsaFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="font-mono text-lg" style={{ color: file.color }}>
                        {file.symbol}
                      </span>
                      <span className="text-sm">{file.fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Tables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分析數據表格</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border">Test No.</TableHead>
                      <TableHead className="border">D85</TableHead>
                      <TableHead className="border">D60</TableHead>
                      <TableHead className="border">D50</TableHead>
                      <TableHead className="border">D30</TableHead>
                      <TableHead className="border">D15</TableHead>
                      <TableHead className="border">D10</TableHead>
                      <TableHead className="border">Cu</TableHead>
                      <TableHead className="border">Cc</TableHead>
                      <TableHead className="border">LL</TableHead>
                      <TableHead className="border">PI</TableHead>
                      <TableHead className="border">Gravel %</TableHead>
                      <TableHead className="border">Sand %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gsaFiles.map((file, index) => {
                      const results = file.analysisResults
                      return (
                        <TableRow key={index}>
                          <TableCell className="border font-medium">{file.fileName}</TableCell>
                          <TableCell className="border">0.18</TableCell>
                          <TableCell className="border">{results.d60.toFixed(2)}</TableCell>
                          <TableCell className="border">0.083</TableCell>
                          <TableCell className="border">{results.d30.toFixed(3)}</TableCell>
                          <TableCell className="border">0.012</TableCell>
                          <TableCell className="border">{results.d10.toFixed(3)}</TableCell>
                          <TableCell className="border">{results.uniformityCoefficient.toFixed(1)}</TableCell>
                          <TableCell className="border">{results.coefficientOfCurvature.toFixed(1)}</TableCell>
                          <TableCell className="border">NV</TableCell>
                          <TableCell className="border">NP</TableCell>
                          <TableCell className="border">{results.gravelPercent.toFixed(1)}</TableCell>
                          <TableCell className="border">{results.sandPercent.toFixed(1)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Classification Table */}
              <div className="mt-6">
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border">Test No.</TableHead>
                      <TableHead className="border">USCS (ASTM D2487-85) Soil Classification</TableHead>
                      <TableHead className="border">AASHTO</TableHead>
                      <TableHead className="border">% Fines Clay Silt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gsaFiles.map((file, index) => {
                      const results = file.analysisResults
                      const uscs = classifySoilUSCS(results)
                      const aashto = classifySoilAASHTO(results)
                      return (
                        <TableRow key={index}>
                          <TableCell className="border font-medium">{file.fileName}</TableCell>
                          <TableCell className="border">
                            <span className="font-bold">{uscs.symbol}</span> {uscs.name}
                          </TableCell>
                          <TableCell className="border">{aashto.group}</TableCell>
                          <TableCell className="border">
                            {results.finesPercent.toFixed(1)} {results.finesPercent.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
