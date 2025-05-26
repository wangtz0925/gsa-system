import type { SieveData, AnalysisResults } from "@/types/sieve-analysis"

export function calculateSieveAnalysis(sieveData: SieveData[], totalMass: number) {
  // Sort sieves by size (largest first)
  const sortedSieves = [...sieveData].sort((a, b) => b.sieveSize - a.sieveSize)

  // Calculate cumulative mass retained and percentages
  let cumulativeMass = 0
  const calculatedSieves = sortedSieves.map((sieve) => {
    cumulativeMass += sieve.massRetained
    const percentRetained = (sieve.massRetained / totalMass) * 100
    const cumulativePercentRetained = (cumulativeMass / totalMass) * 100
    const percentPassing = 100 - cumulativePercentRetained

    return {
      ...sieve,
      cumulativeMassRetained: cumulativeMass,
      percentRetained,
      cumulativePercentRetained,
      percentPassing: Math.max(0, percentPassing),
    }
  })

  // Calculate characteristic diameters using interpolation
  const d10 = interpolateParticleSize(calculatedSieves, 90) // 90% passing
  const d30 = interpolateParticleSize(calculatedSieves, 70) // 70% passing
  const d60 = interpolateParticleSize(calculatedSieves, 40) // 40% passing

  // Calculate coefficients
  const uniformityCoefficient = d10 > 0 ? d60 / d10 : 0
  const coefficientOfCurvature = d10 > 0 && d60 > 0 ? (d30 * d30) / (d10 * d60) : 0

  // Calculate particle size fractions
  const gravelPercent = getPercentRetained(calculatedSieves, 4.75)
  const finesPercent = getPercentPassing(calculatedSieves, 0.075)
  const sandPercent = 100 - gravelPercent - finesPercent

  const analysisResults: AnalysisResults = {
    d10,
    d30,
    d60,
    effectiveSize: d10,
    uniformityCoefficient,
    coefficientOfCurvature,
    gravelPercent,
    sandPercent,
    finesPercent,
    totalMassRetained: cumulativeMass,
    panMass: totalMass - cumulativeMass,
  }

  return {
    sieveData: calculatedSieves,
    analysisResults,
  }
}

function interpolateParticleSize(sieves: SieveData[], targetPercentPassing: number): number {
  // Find the two sieves that bracket the target percent passing
  for (let i = 0; i < sieves.length - 1; i++) {
    const upper = sieves[i]
    const lower = sieves[i + 1]

    if (upper.percentPassing >= targetPercentPassing && lower.percentPassing <= targetPercentPassing) {
      // Linear interpolation on semi-log scale
      const logD1 = Math.log10(upper.sieveSize)
      const logD2 = Math.log10(lower.sieveSize)
      const p1 = upper.percentPassing
      const p2 = lower.percentPassing

      if (p1 === p2) return upper.sieveSize

      const logD = logD1 + ((logD2 - logD1) * (p1 - targetPercentPassing)) / (p1 - p2)
      return Math.pow(10, logD)
    }
  }

  // If not found, return boundary values
  if (targetPercentPassing > sieves[0].percentPassing) {
    return sieves[0].sieveSize
  }
  return sieves[sieves.length - 1].sieveSize
}

function getPercentRetained(sieves: SieveData[], sieveSize: number): number {
  const sieve = sieves.find((s) => Math.abs(s.sieveSize - sieveSize) < 0.001)
  return sieve ? sieve.cumulativePercentRetained : 0
}

function getPercentPassing(sieves: SieveData[], sieveSize: number): number {
  const sieve = sieves.find((s) => Math.abs(s.sieveSize - sieveSize) < 0.001)
  return sieve ? sieve.percentPassing : 100
}
