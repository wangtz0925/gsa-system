"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ArrowLeft } from "lucide-react"
import type { AnalysisResults, TemperatureData } from "@/types/sieve-analysis"

interface TemperatureInputFormProps {
  onTemperatureComplete: (data: TemperatureData) => void
  onPreviousStep: () => void
  sampleInfo: any
  analysisResults: AnalysisResults | null
}

const timeReadings = [2, 5, 15, 30, 60, 250]

export default function TemperatureInputForm({
  onTemperatureComplete,
  onPreviousStep,
  sampleInfo,
  analysisResults,
}: TemperatureInputFormProps) {
  const [hydrometerReadings, setHydrometerReadings] = useState<{ [key: number]: string }>({})
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

  const updateHydrometerReading = (time: number, value: string) => {
    const fieldName = `hydrometer_${time}`
    if (!validateNumericInput(value, fieldName)) {
      return
    }
    setHydrometerReadings((prev) => ({ ...prev, [time]: value }))
  }

  const proceedToResults = () => {
    // 檢查是否所有讀數都已輸入
    const missingReadings = timeReadings.filter((time) => !hydrometerReadings[time] || hydrometerReadings[time] === "")

    if (missingReadings.length > 0) {
      alert(`請輸入所有比重計讀數 (缺少: ${missingReadings.join(", ")} 分鐘)`)
      return
    }

    const temperatureData: TemperatureData = {
      specimenWeight: analysisResults?.finesPercent
        ? (analysisResults.finesPercent / 100) * (sampleInfo.totalMass || 0)
        : 4.9999,
      temperature: 22,
      meniscusCorrection: 0.5,
      dispersantCorrection: 4,
      inputDataMethod: "time-rdgs",
      totalDataPoints: 6,
      hydrometerReadings: Object.fromEntries(
        timeReadings.map((time) => [time, Number.parseFloat(hydrometerReadings[time] || "0")]),
      ),
    }

    onTemperatureComplete(temperatureData)
  }

  // 計算通過 #200 篩的重量
  const specimenWeight = analysisResults?.finesPercent
    ? (analysisResults.finesPercent / 100) * (Number.parseFloat(sampleInfo.totalMass) || 0)
    : 4.9999

  return (
    <div className="space-y-6">
      {/* Fixed Information Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">試驗條件資訊</CardTitle>
          <CardDescription>比重計分析的固定參數</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Specimen Wt. (passing #200):</Label>
                <span className="font-semibold">{specimenWeight.toFixed(4)} grams</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Temperature:</Label>
                <span className="font-semibold">22 °C</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Meniscus correction, Cm:</Label>
                <span className="font-semibold">0.5</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Dispersant correction, Fz:</Label>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Input data method:</Label>
                <span className="font-semibold">time-rdgs</span>
              </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Total no. of data:</Label>
                <span className="font-semibold">6</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hydrometer Readings Input Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">比重計讀數輸入</CardTitle>
          <CardDescription>請輸入各時間點的比重計讀數</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Time (min)</TableHead>
                    <TableHead className="text-center">Hydrometer Rdgs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeReadings.map((time) => (
                    <TableRow key={time}>
                      <TableCell className="text-center font-medium">{time}</TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="text"
                          value={hydrometerReadings[time] || ""}
                          onChange={(e) => updateHydrometerReading(time, e.target.value)}
                          className={`w-32 mx-auto text-center ${errors[`hydrometer_${time}`] ? "border-red-500" : ""}`}
                          placeholder="輸入讀數"
                        />
                        {errors[`hydrometer_${time}`] && (
                          <p className="text-red-500 text-xs mt-1 text-center">{errors[`hydrometer_${time}`]}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-4 mt-4">
              <Button onClick={onPreviousStep} className="flex-1" variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous Step
              </Button>
              <Button onClick={proceedToResults} className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                Complete Input
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
