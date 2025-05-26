"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { FileImage, Trash2 } from "lucide-react"
import type { SieveData } from "@/types/sieve-analysis"

interface GSAFileData {
  fileName: string
  sieveData: SieveData[]
  color: string
  symbol: string
}

const colors = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea"]
const symbols = ["○", "□", "△", "▽", "☆"]

export default function MultiFileChart() {
  const [gsaFiles, setGsaFiles] = useState<GSAFileData[]>([])
  const [errors, setErrors] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    if (files.length > 5) {
      setErrors("最多只能選擇 5 個檔案")
      return
    }

    if (gsaFiles.length + files.length > 5) {
      setErrors("總共最多只能載入 5 個檔案")
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

        if (!gsaData.sieveData || !Array.isArray(gsaData.sieveData)) {
          setErrors(`檔案 ${file.name} 格式不正確`)
          continue
        }

        newFiles.push({
          fileName: gsaData.fileInfo?.fileName || file.name.replace(".gsa", ""),
          sieveData: gsaData.sieveData,
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

    // Reset file input
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
          <p className="font-medium">{`篩網尺寸: ${formatXAxisTick(label)} mm`}</p>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">多檔案粒徑分布比較</CardTitle>
          <CardDescription>選擇最多 5 個 GSA 檔案進行粒徑分布曲線比較</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gsa-files">選擇 GSA 檔案 (最多 5 個)</Label>
            <Input
              ref={fileInputRef}
              id="gsa-files"
              type="file"
              multiple
              accept=".gsa"
              onChange={handleFileUpload}
              disabled={gsaFiles.length >= 5}
            />
            {errors && <p className="text-red-500 text-sm">{errors}</p>}
          </div>

          {gsaFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>已載入的檔案 ({gsaFiles.length}/5)</Label>
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

      {gsaFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              GRAIN SIZE DISTRIBUTION TEST REPORT
              <Button onClick={exportChart} variant="outline" size="sm">
                <FileImage className="w-4 h-4 mr-2" />
                匯出圖表
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full" id="multi-file-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="sieveSize"
                    scale="log"
                    domain={["dataMin", "dataMax"]}
                    type="number"
                    tickFormatter={formatXAxisTick}
                    label={{ value: "Diameter of Particle in Millimeters", position: "insideBottom", offset: -10 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: "Percent Passing by Weight", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />

                  {gsaFiles.map((file, index) => (
                    <Line
                      key={index}
                      type="monotone"
                      dataKey={`file_${index}`}
                      stroke={file.color}
                      strokeWidth={2}
                      dot={{ fill: file.color, strokeWidth: 2, r: 4 }}
                      name={file.fileName}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with symbols */}
            <div className="mt-4 p-4 border rounded bg-muted/50">
              <h4 className="font-medium mb-2">圖例</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
      )}
    </div>
  )
}
