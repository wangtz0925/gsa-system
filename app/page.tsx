"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SieveAnalysisForm from "@/components/sieve-analysis-form"
import TemperatureInputForm from "@/components/temperature-input-form"
import GrainSizeCurve from "@/components/grain-size-curve"
import SoilClassification from "@/components/soil-classification"
import ResultsTable from "@/components/results-table"
import FileMergeChart from "@/components/file-merge-chart"
import AuthWrapper from "@/components/auth/auth-wrapper"
import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"
import AdminPanel from "@/components/admin/admin-panel"
import { AuthService } from "@/lib/auth"

export default function GSASystem() {
  const [sieveData, setSieveData] = useState<SieveData[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null)
  const [currentStep, setCurrentStep] = useState<"sieve" | "temperature" | "results">("sieve")
  const [sampleInfo, setSampleInfo] = useState({
    fileName: "",
    sampleId: "",
    location: "",
    depth: "",
    totalMass: "",
    specificGravity: "",
    liquidLimit: "",
    plasticLimit: "",
    date: new Date().toISOString().split("T")[0],
  })

  const [activeTab, setActiveTab] = useState<string>("input")

  // 在組件中添加管理員檢查
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const user = AuthService.getCurrentUser()
    setCurrentUser(user)
  }, [])

  const isAdmin = currentUser && AuthService.isAdmin(currentUser.username)

  const handleSieveAnalysisComplete = (data: SieveData[], results: AnalysisResults) => {
    setSieveData(data)
    setAnalysisResults(results)
    setCurrentStep("temperature")
    setActiveTab("temperature")
  }

  const handleTemperatureComplete = (data: TemperatureData) => {
    setTemperatureData(data)
    setCurrentStep("results")
    setActiveTab("results")
  }

  const handleTabChange = (value: string) => {
    // 只有在對應步驟完成後才允許切換
    if (value === "input") {
      setActiveTab(value)
    } else if (value === "temperature" && currentStep !== "sieve") {
      setActiveTab(value)
    } else if (value === "results" && currentStep === "results") {
      setActiveTab(value)
    } else if ((value === "curve" || value === "classification") && analysisResults) {
      setActiveTab(value)
    } else if (value === "file-merge") {
      setActiveTab(value)
    } else if (value === "admin") {
      setActiveTab(value)
    }
  }

  return (
    <AuthWrapper>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">岩土工程篩分析系統</h1>
          <p className="text-muted-foreground">專業顆粒粒徑分布分析與土壤分類系統</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-7" : "grid-cols-6"}`}>
            <TabsTrigger value="input" disabled={currentStep !== "sieve" && activeTab !== "input"}>
              篩分析數據
            </TabsTrigger>
            <TabsTrigger value="temperature" disabled={currentStep === "sieve"}>
              溫度輸入
            </TabsTrigger>
            <TabsTrigger value="results" disabled={currentStep !== "results"}>
              分析結果
            </TabsTrigger>
            <TabsTrigger value="curve" disabled={!analysisResults}>
              粒徑分布曲線
            </TabsTrigger>
            <TabsTrigger value="classification" disabled={!analysisResults}>
              土壤分類
            </TabsTrigger>
            <TabsTrigger value="file-merge">檔案合併</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">管理員模式</TabsTrigger>}
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>樣品資訊與篩分析數據</CardTitle>
                <CardDescription>輸入樣品詳細資料與篩分析測量數據</CardDescription>
              </CardHeader>
              <CardContent>
                <SieveAnalysisForm
                  onAnalysisComplete={handleSieveAnalysisComplete}
                  sampleInfo={sampleInfo}
                  setSampleInfo={setSampleInfo}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="temperature" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>溫度與比重計讀數</CardTitle>
                <CardDescription>輸入溫度條件與比重計測量數據</CardDescription>
              </CardHeader>
              <CardContent>
                <TemperatureInputForm
                  onTemperatureComplete={handleTemperatureComplete}
                  sampleInfo={sampleInfo}
                  analysisResults={analysisResults}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResults && (
              <Card>
                <CardHeader>
                  <CardTitle>分析結果</CardTitle>
                  <CardDescription>詳細篩分析結果與計算數據</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResultsTable
                    data={sieveData}
                    results={analysisResults}
                    sampleInfo={sampleInfo}
                    temperatureData={temperatureData}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="curve" className="space-y-6">
            {analysisResults && (
              <GrainSizeCurve
                data={sieveData}
                results={analysisResults}
                sampleInfo={sampleInfo}
                temperatureData={temperatureData}
              />
            )}
          </TabsContent>

          <TabsContent value="classification" className="space-y-6">
            {analysisResults && (
              <Card>
                <CardHeader>
                  <CardTitle>土壤分類</CardTitle>
                  <CardDescription>USCS 與 AASHTO 分類系統</CardDescription>
                </CardHeader>
                <CardContent>
                  <SoilClassification results={analysisResults} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="file-merge" className="space-y-6">
            <FileMergeChart />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <AdminPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AuthWrapper>
  )
}
