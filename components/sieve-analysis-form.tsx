"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { SieveData, AnalysisResults } from "@/types/sieve-analysis"
import { calculateSieveAnalysis } from "@/lib/sieve-calculations"

interface SieveAnalysisFormProps {
  onAnalysisComplete: (data: SieveData[], results: AnalysisResults) => void
  sampleInfo: any
  setSampleInfo: (info: any) => void
}

const fixedSieves = [
  { size: 0.075, opening: "No. 200" },
  { size: 0.15, opening: "No. 100" },
  { size: 0.25, opening: "No. 60" },
  { size: 0.425, opening: "No. 40" },
  { size: 0.85, opening: "No. 20" },
  { size: 2.0, opening: "No. 10" },
  { size: 4.75, opening: "No. 4" },
  { size: 9.525, opening: "3/8 in." },
  { size: 19.05, opening: "3/4 in." },
  { size: 25.4, opening: "1 in." },
]

export default function SieveAnalysisForm({ onAnalysisComplete, sampleInfo, setSampleInfo }: SieveAnalysisFormProps) {
  const [sieveData, setSieveData] = useState<SieveData[]>(
    fixedSieves.map((sieve) => ({
      sieveSize: sieve.size,
      sieveOpening: sieve.opening,
      massRetained: 0,
      cumulativeMassRetained: 0,
      percentRetained: 0,
      cumulativePercentRetained: 0,
      percentPassing: 100,
    })),
  )

  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateNumericInput = (value: string, fieldName: string) => {
    const numericRegex = /^\d*\.?\d*$/
    if (value === "") {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }))
      return true
    }
    if (!numericRegex.test(value)) {
      setErrors((prev) => ({ ...prev, [fieldName]: "僅能輸入數字" }))
      return false
    }
    setErrors((prev) => ({ ...prev, [fieldName]: "" }))
    return true
  }

  const updateSieveData = (index: number, field: keyof SieveData, value: number | string) => {
    if (field === "massRetained") {
      const fieldName = `sieve_${index}`
      if (!validateNumericInput(value.toString(), fieldName)) {
        return
      }
    }

    const newData = [...sieveData]
    newData[index] = { ...newData[index], [field]: value }
    setSieveData(newData)
  }

  const updateSampleInfo = (field: string, value: string) => {
    if (field === "totalMass" || field === "specificGravity" || field === "liquidLimit" || field === "plasticLimit") {
      if (!validateNumericInput(value, field)) {
        return
      }
    }
    setSampleInfo({ ...sampleInfo, [field]: value })
  }

  const calculatePanRetained = () => {
    const totalRetained = sieveData.reduce((sum, sieve) => sum + (sieve.massRetained || 0), 0)
    return (sampleInfo.totalMass || 0) - totalRetained
  }

  const panRetained = calculatePanRetained()

  const proceedToNextStep = () => {
    if (!sampleInfo.totalMass || sampleInfo.totalMass <= 0) {
      alert("請輸入有效的總重")
      return
    }

    if (panRetained < 4.2) {
      alert("剩餘重量<4.2，請重新確認!")
      return
    }

    const results = calculateSieveAnalysis(sieveData, sampleInfo.totalMass)
    setSieveData(results.sieveData)
    onAnalysisComplete(results.sieveData, results.analysisResults)
  }

  return (
    <div className="space-y-6">
      {/* Fixed Information Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">試驗方法資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Input data method:</Label>
              <p className="text-lg font-semibold">Wt. retained</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Type of Hydrometer used:</Label>
              <p className="text-lg font-semibold">151H</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Input Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">檔案名稱</Label>
              <Input
                id="fileName"
                value={sampleInfo.fileName || ""}
                onChange={(e) => setSampleInfo({ ...sampleInfo, fileName: e.target.value })}
                placeholder="輸入檔案名稱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalMass">總重 (g)</Label>
              <Input
                id="totalMass"
                type="text"
                value={sampleInfo.totalMass || ""}
                onChange={(e) => updateSampleInfo("totalMass", e.target.value)}
                placeholder="例如：500"
                className={errors.totalMass ? "border-red-500" : ""}
              />
              {errors.totalMass && <p className="text-red-500 text-sm">{errors.totalMass}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specificGravity">Specific gravity</Label>
              <Input
                id="specificGravity"
                type="text"
                value={sampleInfo.specificGravity || ""}
                onChange={(e) => updateSampleInfo("specificGravity", e.target.value)}
                placeholder="例如：2.65"
                className={errors.specificGravity ? "border-red-500" : ""}
              />
              {errors.specificGravity && <p className="text-red-500 text-sm">{errors.specificGravity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="liquidLimit">Liquid limit (LL) (%)</Label>
              <Input
                id="liquidLimit"
                type="text"
                value={sampleInfo.liquidLimit || ""}
                onChange={(e) => updateSampleInfo("liquidLimit", e.target.value)}
                placeholder="例如：25"
                className={errors.liquidLimit ? "border-red-500" : ""}
              />
              {errors.liquidLimit && <p className="text-red-500 text-sm">{errors.liquidLimit}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="plasticLimit">Plastic limit (PL) (%)</Label>
              <Input
                id="plasticLimit"
                type="text"
                value={sampleInfo.plasticLimit || ""}
                onChange={(e) => updateSampleInfo("plasticLimit", e.target.value)}
                placeholder="例如：15"
                className={errors.plasticLimit ? "border-red-500" : ""}
              />
              {errors.plasticLimit && <p className="text-red-500 text-sm">{errors.plasticLimit}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">試驗日期</Label>
            <Input
              id="date"
              type="date"
              value={sampleInfo.date}
              onChange={(e) => setSampleInfo({ ...sampleInfo, date: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Optional Fields Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            可選欄位
            <div className="flex items-center space-x-2">
              <Switch checked={showOptionalFields} onCheckedChange={setShowOptionalFields} />
              {showOptionalFields ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </div>
          </CardTitle>
        </CardHeader>
        {showOptionalFields && (
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sampleId">樣品編號</Label>
              <Input
                id="sampleId"
                value={sampleInfo.sampleId || ""}
                onChange={(e) => setSampleInfo({ ...sampleInfo, sampleId: e.target.value })}
                placeholder="例如：S-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">取樣位置</Label>
              <Input
                id="location"
                value={sampleInfo.location || ""}
                onChange={(e) => setSampleInfo({ ...sampleInfo, location: e.target.value })}
                placeholder="例如：鑽孔 BH-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth">深度 (m)</Label>
              <Input
                id="depth"
                value={sampleInfo.depth || ""}
                onChange={(e) => setSampleInfo({ ...sampleInfo, depth: e.target.value })}
                placeholder="例如：2.5-3.0"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sieve Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">篩分析數據</CardTitle>
          <CardDescription>輸入各篩網上的滯留質量，完成後點擊下一步驟進行分析。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>篩網開口</TableHead>
                    {showOptionalFields && <TableHead>篩網尺寸 (mm)</TableHead>}
                    <TableHead>滯留質量 (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sieveData.map((sieve, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{sieve.sieveOpening}</TableCell>
                      {showOptionalFields && <TableCell>{sieve.sieveSize}</TableCell>}
                      <TableCell>
                        <Input
                          type="text"
                          value={sieve.massRetained || ""}
                          onChange={(e) =>
                            updateSieveData(index, "massRetained", Number.parseFloat(e.target.value) || 0)
                          }
                          className={`w-24 ${errors[`sieve_${index}`] ? "border-red-500" : ""}`}
                          placeholder="0"
                        />
                        {errors[`sieve_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`sieve_${index}`]}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/50">
                    <TableCell className="font-bold">Pan retained</TableCell>
                    {showOptionalFields && <TableCell>{"<0.075"}</TableCell>}
                    <TableCell>
                      <div className={`font-semibold ${panRetained < 4.2 ? "text-red-500" : ""}`}>
                        {panRetained.toFixed(1)} g
                      </div>
                      {panRetained < 4.2 && <p className="text-red-500 text-xs mt-1">剩餘重量過低</p>}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Button onClick={proceedToNextStep} className="w-full" disabled={panRetained < 4.2}>
              <ArrowRight className="w-4 h-4 mr-2" />
              下一步驟
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
