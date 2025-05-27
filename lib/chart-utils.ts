import type { SampleData, ChartDataPoint } from "@/types/grain-size"

export const CHART_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
]

export const CHART_SYMBOLS = ["○", "□", "△", "▽", "☆", "◇", "◎", "■", "▲", "▼"]

export function formatParticleSize(size: number): string {
  if (size >= 1) return size.toFixed(0)
  if (size >= 0.1) return size.toFixed(1)
  return size.toFixed(3)
}

export function getLogPosition(value: number, min: number, max: number): number {
  const logValue = Math.log10(value)
  const logMin = Math.log10(min)
  const logMax = Math.log10(max)
  return (logValue - logMin) / (logMax - logMin)
}

export function combineDataPoints(samples: SampleData[]): ChartDataPoint[] {
  const allPoints: ChartDataPoint[] = []

  samples.forEach((sample) => {
    // Add sieve data points
    sample.sieveData.forEach((sieve) => {
      if (sieve.sieveSize > 0 && sieve.percentPassing !== undefined) {
        allPoints.push({
          particleSize: sieve.sieveSize,
          percentPassing: sieve.percentPassing,
          sampleId: sample.id,
          dataType: "sieve",
        })
      }
    })

    // Add hydrometer data points
    if (sample.hydrometerData) {
      sample.hydrometerData.forEach((hydro) => {
        if (hydro.particleSize > 0 && hydro.percentFiner !== undefined) {
          allPoints.push({
            particleSize: hydro.particleSize,
            percentPassing: hydro.percentFiner,
            sampleId: sample.id,
            dataType: "hydrometer",
          })
        }
      })
    }
  })

  return allPoints.sort((a, b) => b.particleSize - a.particleSize)
}

export function generateChartData(samples: SampleData[]) {
  const allPoints = combineDataPoints(samples)

  // Create a comprehensive set of particle sizes for interpolation
  const particleSizes = new Set<number>()

  // Add all actual data points
  allPoints.forEach((point) => particleSizes.add(point.particleSize))

  // Add standard sieve sizes for complete coverage
  const standardSizes = [
    100, 75, 50, 37.5, 25, 19, 12.5, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075, 0.05, 0.02, 0.01, 0.005, 0.002,
    0.001,
  ]
  standardSizes.forEach((size) => particleSizes.add(size))

  const sortedSizes = Array.from(particleSizes).sort((a, b) => b - a)

  return sortedSizes
    .map((size) => {
      const dataPoint: any = { particleSize: size }

      samples.forEach((sample) => {
        const samplePoints = allPoints.filter((p) => p.sampleId === sample.id)
        const interpolatedValue = interpolatePercentPassing(samplePoints, size)
        dataPoint[`sample_${sample.id}`] = interpolatedValue
      })

      return dataPoint
    })
    .filter((point) => point.particleSize >= 0.001 && point.particleSize <= 100)
}

function interpolatePercentPassing(points: ChartDataPoint[], targetSize: number): number | null {
  if (points.length === 0) return null

  const sortedPoints = points.sort((a, b) => b.particleSize - a.particleSize)

  // Find exact match
  const exactMatch = sortedPoints.find((p) => Math.abs(p.particleSize - targetSize) < 0.0001)
  if (exactMatch) return exactMatch.percentPassing

  // Find bracketing points
  let upperPoint = null
  let lowerPoint = null

  for (let i = 0; i < sortedPoints.length; i++) {
    if (sortedPoints[i].particleSize > targetSize) {
      upperPoint = sortedPoints[i]
    } else {
      lowerPoint = sortedPoints[i]
      break
    }
  }

  // Extrapolation cases
  if (!upperPoint && lowerPoint) {
    return lowerPoint.percentPassing
  }
  if (upperPoint && !lowerPoint) {
    return upperPoint.percentPassing
  }
  if (!upperPoint && !lowerPoint) {
    return null
  }

  // Linear interpolation on log scale
  if (upperPoint && lowerPoint) {
    const logTarget = Math.log10(targetSize)
    const logUpper = Math.log10(upperPoint.particleSize)
    const logLower = Math.log10(lowerPoint.particleSize)

    if (logUpper === logLower) return upperPoint.percentPassing

    const ratio = (logTarget - logUpper) / (logLower - logUpper)
    return upperPoint.percentPassing + ratio * (lowerPoint.percentPassing - upperPoint.percentPassing)
  }

  return null
}
