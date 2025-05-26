"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, Database } from "lucide-react"
import { exportToPDF, exportToExcel, exportToGSA } from "@/lib/export-utils"

interface ResultsTableProps {
  data: SieveData[]
  results: AnalysisResults
  sampleInfo: any
  temperatureData?: TemperatureData | null
}

export default function ResultsTable({ data, results, sampleInfo, temperatureData }: ResultsTableProps) {
  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">匯出報告</CardTitle>
          <CardDescription>將分析結果匯出為不同格式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={() => exportToPDF(data, results, sampleInfo, temperatureData)}
              className="flex items-center gap-2"
              variant="default"
            >
              <FileText className="w-4 h-4" />
              匯出 PDF 報告
            </Button>
            <Button
              onClick={() => exportToExcel(data, results, sampleInfo, temperatureData)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <FileSpreadsheet className="w-4 h-4" />
              匯出 Excel 檔案
            </Button>
            <Button
              onClick={() => exportToGSA(data, results, sampleInfo, temperatureData)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <Database className="w-4 h-4" />
              存檔為 GSA 格式
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Data Display */}
      {temperatureData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">比重計分析數據</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">試驗條件</h4>
                <div className="text-sm space-y-1">
                  <p>Specimen Wt. (passing #200): {temperatureData.specimenWeight.toFixed(4)} grams</p>
                  <p>Temperature: {temperatureData.temperature} °C</p>
                  <p>Meniscus correction: {temperatureData.meniscusCorrection}</p>
                  <p>Dispersant correction: {temperatureData.dispersantCorrection}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">比重計讀數</h4>
                <div className="text-sm space-y-1">
                  {Object.entries(temperatureData.hydrometerReadings).map(([time, reading]) => (
                    <p key={time}>
                      {time} min: {reading}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">樣品摘要</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">檔案名稱</p>
            <p className="text-lg font-semibold">{sampleInfo.fileName || "未命名"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">總重</p>
            <p className="text-lg font-semibold">{sampleInfo.totalMass} g</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Specific gravity</p>
            <p className="text-lg font-semibold">{sampleInfo.specificGravity || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">試驗日期</p>
            <p className="text-lg font-semibold">{sampleInfo.date}</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">關鍵級配參數</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">D₁₀</p>
            <p className="text-lg font-semibold">{results.d10.toFixed(3)} mm</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">D₃₀</p>
            <p className="text-lg font-semibold">{results.d30.toFixed(3)} mm</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">D₆₀</p>
            <p className="text-lg font-semibold">{results.d60.toFixed(3)} mm</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">有效粒徑</p>
            <p className="text-lg font-semibold">{results.effectiveSize.toFixed(3)} mm</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">均勻係數 (Cᵤ)</p>
            <p className="text-lg font-semibold">{results.uniformityCoefficient.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">曲率係數 (Cᶜ)</p>
            <p className="text-lg font-semibold">{results.coefficientOfCurvature.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">礫石 (%)</p>
            <p className="text-lg font-semibold">{results.gravelPercent.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">砂 (%)</p>
            <p className="text-lg font-semibold">{results.sandPercent.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">細料 (%)</p>
            <p className="text-lg font-semibold">{results.finesPercent.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">詳細篩分析結果</CardTitle>
          <CardDescription>完整顆粒粒徑分布明細</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>篩網開口</TableHead>
                  <TableHead>篩網尺寸 (mm)</TableHead>
                  <TableHead>滞留質量 (g)</TableHead>
                  <TableHead>累積滞留質量 (g)</TableHead>
                  <TableHead>滞留百分比</TableHead>
                  <TableHead>累積滞留百分比</TableHead>
                  <TableHead>通過百分比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data
                  .filter((sieve) => sieve.massRetained > 0 || sieve.sieveSize >= 0.075)
                  .sort((a, b) => b.sieveSize - a.sieveSize)
                  .map((sieve, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{sieve.sieveOpening}</TableCell>
                      <TableCell>{sieve.sieveSize}</TableCell>
                      <TableCell>{sieve.massRetained.toFixed(1)}</TableCell>
                      <TableCell>{sieve.cumulativeMassRetained.toFixed(1)}</TableCell>
                      <TableCell>{sieve.percentRetained.toFixed(1)}%</TableCell>
                      <TableCell>{sieve.cumulativePercentRetained.toFixed(1)}%</TableCell>
                      <TableCell className="font-semibold">{sieve.percentPassing.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Pan</TableCell>
                  <TableCell>{"<0.075"}</TableCell>
                  <TableCell>{results.panMass.toFixed(1)}</TableCell>
                  <TableCell>{results.totalMassRetained.toFixed(1)}</TableCell>
                  <TableCell>{((results.panMass / results.totalMassRetained) * 100).toFixed(1)}%</TableCell>
                  <TableCell>100.0%</TableCell>
                  <TableCell className="font-semibold">0.0%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
