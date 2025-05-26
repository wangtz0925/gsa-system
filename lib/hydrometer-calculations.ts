import type { TemperatureData, SieveData } from "@/types/sieve-analysis"

export interface HydrometerPoint {
  time: number // minutes
  particleSize: number // mm
  percentFiner: number // %
}

export function calculateHydrometerAnalysis(
  temperatureData: TemperatureData,
  sieveData: SieveData[],
): HydrometerPoint[] {
  const hydrometerPoints: HydrometerPoint[] = []

  // Constants for hydrometer analysis
  const specificGravity = 2.65 // Default value
  const viscosity = getViscosity(temperatureData.temperature)
  const hydrometerConstant = 0.013 // For 151H hydrometer

  Object.entries(temperatureData.hydrometerReadings).forEach(([timeStr, reading]) => {
    const time = Number.parseInt(timeStr)

    // Calculate effective depth
    const effectiveDepth = calculateEffectiveDepth(reading)

    // Calculate particle diameter using Stokes' law
    const particleSize =
      Math.sqrt((18 * viscosity * effectiveDepth) / ((specificGravity - 1) * 9.81 * time * 60)) * 1000 // Convert to mm

    // Calculate percent finer
    const correctedReading = reading - temperatureData.meniscusCorrection - temperatureData.dispersantCorrection
    const percentFiner = ((correctedReading * hydrometerConstant) / temperatureData.specimenWeight) * 100

    // Get percent passing #200 sieve for scaling
    const sieve200 = sieveData.find((s) => Math.abs(s.sieveSize - 0.075) < 0.001)
    const scalingFactor = sieve200 ? sieve200.percentPassing / 100 : 1

    hydrometerPoints.push({
      time,
      particleSize,
      percentFiner: percentFiner * scalingFactor,
    })
  })

  return hydrometerPoints.sort((a, b) => b.particleSize - a.particleSize)
}

function getViscosity(temperature: number): number {
  // Water viscosity at different temperatures (Pa·s)
  const viscosityTable: { [key: number]: number } = {
    15: 0.001139,
    16: 0.001109,
    17: 0.001081,
    18: 0.001053,
    19: 0.001027,
    20: 0.001002,
    21: 0.000978,
    22: 0.000955,
    23: 0.000933,
    24: 0.000911,
    25: 0.00089,
  }

  return viscosityTable[temperature] || 0.001002 // Default to 20°C
}

function calculateEffectiveDepth(reading: number): number {
  // Effective depth calculation for 151H hydrometer
  // This is a simplified calculation - actual values depend on hydrometer calibration
  return 0.164 - 0.00264 * reading // meters
}
