import type { AnalysisResults, USCSClassification, AASHTOClassification } from "@/types/sieve-analysis"

export function classifySoilUSCS(results: AnalysisResults): USCSClassification {
  const { gravelPercent, sandPercent, finesPercent, uniformityCoefficient, coefficientOfCurvature } = results

  // Coarse-grained soils (< 50% fines)
  if (finesPercent < 50) {
    // Gravels (> 50% of coarse fraction retained on #4 sieve)
    if (gravelPercent > sandPercent) {
      if (finesPercent < 5) {
        // Clean gravels
        if (uniformityCoefficient >= 4 && coefficientOfCurvature >= 1 && coefficientOfCurvature <= 3) {
          return {
            symbol: "GW",
            name: "Well-graded gravel",
            description: "級配良好礫石，細料含量少或無",
            criteria: ["Cu ≥ 4", "1 ≤ Cc ≤ 3", "細料 < 5%"],
            properties: ["Excellent drainage", "High strength", "Low compressibility"],
          }
        } else {
          return {
            symbol: "GP",
            name: "Poorly graded gravel",
            description: "級配不良礫石，細料含量少或無",
            criteria: ["不符合 GW 標準", "細料 < 5%"],
            properties: ["Good drainage", "Medium strength", "Low compressibility"],
          }
        }
      } else if (finesPercent >= 5 && finesPercent <= 12) {
        // Gravels with fines - dual symbol needed (simplified here)
        return {
          symbol: "GW-GM",
          name: "Well-graded gravel with silt",
          description: "含粉土細料的級配良好礫石",
          criteria: ["5% ≤ 細料 ≤ 12%", "符合 GW 標準"],
          properties: ["Good drainage", "High strength", "Low compressibility"],
        }
      } else {
        // Gravels with fines > 12%
        return {
          symbol: "GM",
          name: "Silty gravel",
          description: "含粉土細料的礫石",
          criteria: ["細料 > 12%", "細料為粉土質"],
          properties: ["Fair drainage", "Medium strength", "Medium compressibility"],
        }
      }
    } else {
      // Sands
      if (finesPercent < 5) {
        // Clean sands
        if (uniformityCoefficient >= 6 && coefficientOfCurvature >= 1 && coefficientOfCurvature <= 3) {
          return {
            symbol: "SW",
            name: "Well-graded sand",
            description: "級配良好砂，細料含量少或無",
            criteria: ["Cu ≥ 6", "1 ≤ Cc ≤ 3", "細料 < 5%"],
            properties: ["Good drainage", "Medium strength", "Low compressibility"],
          }
        } else {
          return {
            symbol: "SP",
            name: "Poorly graded sand",
            description: "級配不良砂，細料含量少或無",
            criteria: ["不符合 SW 標準", "細料 < 5%"],
            properties: ["Good drainage", "Low to medium strength", "Low compressibility"],
          }
        }
      } else {
        // Sands with fines
        return {
          symbol: "SM",
          name: "Silty sand",
          description: "含粉土細料的砂",
          criteria: ["細料 ≥ 5%", "細料為粉土質"],
          properties: ["Fair drainage", "Medium strength", "Medium compressibility"],
        }
      }
    }
  } else {
    // Fine-grained soils (≥ 50% fines)
    return {
      symbol: "ML",
      name: "Silt",
      description: "低塑性無機粉土",
      criteria: ["細料 ≥ 50%", "低塑性"],
      properties: ["Poor drainage", "Low strength", "High compressibility"],
    }
  }
}

export function classifySoilAASHTO(results: AnalysisResults): AASHTOClassification {
  const { gravelPercent, sandPercent, finesPercent } = results

  // Calculate group index (simplified - normally requires plasticity index)
  let groupIndex = 0
  if (finesPercent > 35) {
    groupIndex = Math.round((finesPercent - 35) * 0.2)
  }

  // Granular materials (≤ 35% fines)
  if (finesPercent <= 35) {
    if (gravelPercent > 50) {
      if (finesPercent <= 15) {
        return {
          group: "A-1-a",
          name: "Stone fragments, gravel and sand",
          description: "級配良好粒狀材料",
          groupIndex: 0,
          suitability: ["Excellent subgrade material", "Good base material", "Excellent drainage"],
        }
      } else {
        return {
          group: "A-2-4",
          name: "Silty or clayey gravel and sand",
          description: "含粉土細料的粒狀材料",
          groupIndex: Math.min(groupIndex, 4),
          suitability: ["Good to fair subgrade material", "Fair base material", "Good drainage"],
        }
      }
    } else {
      if (finesPercent <= 10) {
        return {
          group: "A-1-b",
          name: "Stone fragments, gravel and sand",
          description: "級配良好粒狀材料",
          groupIndex: 0,
          suitability: ["Excellent subgrade material", "Good base material", "Excellent drainage"],
        }
      } else {
        return {
          group: "A-3",
          name: "Fine sand",
          description: "級配不良細砂",
          groupIndex: 0,
          suitability: ["Fair subgrade material", "Poor base material", "Good drainage"],
        }
      }
    }
  } else {
    // Silt-clay materials (> 35% fines)
    if (finesPercent <= 50) {
      return {
        group: "A-4",
        name: "Silty soils",
        description: "低塑性粉土質土壤",
        groupIndex: Math.min(groupIndex, 8),
        suitability: ["Fair to poor subgrade material", "Not suitable for base", "Poor drainage"],
      }
    } else {
      return {
        group: "A-6",
        name: "Clayey soils",
        description: "中塑性黏土質土壤",
        groupIndex: Math.min(groupIndex, 20),
        suitability: ["Poor subgrade material", "Not suitable for base", "Very poor drainage"],
      }
    }
  }
}
