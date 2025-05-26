export interface SieveData {
  sieveSize: number // mm
  sieveOpening: string // e.g., "#4", "3/8""
  massRetained: number // grams
  cumulativeMassRetained: number // grams
  percentRetained: number // %
  cumulativePercentRetained: number // %
  percentPassing: number // %
}

export interface AnalysisResults {
  d10: number // mm
  d30: number // mm
  d60: number // mm
  effectiveSize: number // mm (same as d10)
  uniformityCoefficient: number // Cu = d60/d10
  coefficientOfCurvature: number // Cc = (d30)²/(d10×d60)
  gravelPercent: number // % > 4.75mm
  sandPercent: number // % 0.075-4.75mm
  finesPercent: number // % < 0.075mm
  totalMassRetained: number // grams
  panMass: number // grams
}

export interface TemperatureData {
  specimenWeight: number // grams (passing #200)
  temperature: number // °C
  meniscusCorrection: number // Cm
  dispersantCorrection: number // Fz
  inputDataMethod: string // "time-rdgs"
  totalDataPoints: number // 6
  hydrometerReadings: { [time: number]: number } // time in minutes -> reading
}

export interface USCSClassification {
  symbol: string
  name: string
  description: string
  criteria: string[]
  properties: string[]
}

export interface AASHTOClassification {
  group: string
  name: string
  description: string
  groupIndex: number
  suitability: string[]
}
