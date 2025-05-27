export interface SieveData {
  sieveSize: number // mm
  sieveOpening: string // e.g., "#4", "3/8""
  massRetained: number // grams
  cumulativeMassRetained: number // grams
  percentRetained: number // %
  cumulativePercentRetained: number // %
  percentPassing: number // %
}

export interface HydrometerData {
  time: number // minutes
  particleSize: number // mm
  percentFiner: number // %
}

export interface SampleData {
  id: string
  name: string
  location?: string
  depth?: string
  specificGravity?: number
  liquidLimit?: number
  plasticLimit?: number
  sieveData: SieveData[]
  hydrometerData?: HydrometerData[]
  color: string
  symbol: string
}

export interface ChartDataPoint {
  particleSize: number
  percentPassing: number
  sampleId: string
  dataType: "sieve" | "hydrometer"
}
