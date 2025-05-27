"use client"

import ProfessionalGrainSizeChart from "./professional-grain-size-chart"
import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"

interface GrainSizeCurveProps {
  data: SieveData[]
  results: AnalysisResults
  sampleInfo: {
    sampleId: string
    fileName: string
    location?: string
    depth?: string
    specificGravity?: string
    liquidLimit?: string
    plasticLimit?: string
  }
  temperatureData?: TemperatureData | null
}

export default function GrainSizeCurve({ data, results, sampleInfo, temperatureData }: GrainSizeCurveProps) {
  return (
    <div className="space-y-6">
      <ProfessionalGrainSizeChart
        data={data}
        results={results}
        sampleInfo={sampleInfo}
        temperatureData={temperatureData}
        title="Grain Size Distribution Curve"
      />
    </div>
  )
}
