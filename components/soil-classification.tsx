"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AnalysisResults } from "@/types/sieve-analysis"
import { classifySoilUSCS, classifySoilAASHTO } from "@/lib/soil-classification"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { exportClassificationReport } from "@/lib/classification-export"

interface SoilClassificationProps {
  results: AnalysisResults
}

export default function SoilClassification({ results }: SoilClassificationProps) {
  const uscsClassification = classifySoilUSCS(results)
  const aashtoClassification = classifySoilAASHTO(results)

  return (
    <div className="space-y-6">
      {/* USCS Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">USCS 分類</CardTitle>
          <CardDescription>統一土壤分類系統 (ASTM D2487)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-lg px-4 py-2">
              {uscsClassification.symbol}
            </Badge>
            <div>
              <p className="font-semibold">{uscsClassification.name}</p>
              <p className="text-sm text-muted-foreground">{uscsClassification.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="font-medium mb-2">分類標準</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {uscsClassification.criteria.map((criterion, index) => (
                  <li key={index}>• {criterion}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">工程性質</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {uscsClassification.properties.map((property, index) => (
                  <li key={index}>• {property}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AASHTO Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AASHTO 分類</CardTitle>
          <CardDescription>美國州公路與運輸官員協會分類系統 (AASHTO M 145)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {aashtoClassification.group}
            </Badge>
            <div>
              <p className="font-semibold">{aashtoClassification.name}</p>
              <p className="text-sm text-muted-foreground">{aashtoClassification.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="font-medium mb-2">群組指數</h4>
              <p className="text-2xl font-bold text-primary">{aashtoClassification.groupIndex}</p>
              <p className="text-sm text-muted-foreground">
                {aashtoClassification.groupIndex <= 4
                  ? "良好至尚可"
                  : aashtoClassification.groupIndex <= 8
                    ? "尚可至不良"
                    : "不良"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">適用性</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {aashtoClassification.suitability.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">分類摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">主要分類</p>
              <p className="text-xl font-bold">{uscsClassification.symbol}</p>
              <p className="text-sm">{uscsClassification.name}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">AASHTO 群組</p>
              <p className="text-xl font-bold">{aashtoClassification.group}</p>
              <p className="text-sm">GI = {aashtoClassification.groupIndex}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">級配</p>
              <p className="text-xl font-bold">
                {results.uniformityCoefficient > 4 &&
                results.coefficientOfCurvature > 1 &&
                results.coefficientOfCurvature < 3
                  ? "WG"
                  : "PG"}
              </p>
              <p className="text-sm">
                {results.uniformityCoefficient > 4 &&
                results.coefficientOfCurvature > 1 &&
                results.coefficientOfCurvature < 3
                  ? "級配良好"
                  : "級配不良"}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => exportClassificationReport(results)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              匯出分類報告
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
