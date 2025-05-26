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
            name: "級配良好礫石",
            description: "級配良好礫石，細料含量少或無",
            criteria: ["Cu ≥ 4", "1 ≤ Cc ≤ 3", "細料 < 5%"],
            properties: ["排水性優良", "強度高", "壓縮性低"],
          }
        } else {
          return {
            symbol: "GP",
            name: "級配不良礫石",
            description: "級配不良礫石，細料含量少或無",
            criteria: ["不符合 GW 標準", "細料 < 5%"],
            properties: ["排水性良好", "強度中等", "壓縮性低"],
          }
        }
      } else if (finesPercent >= 5 && finesPercent <= 12) {
        // Gravels with fines - dual symbol needed (simplified here)
        return {
          symbol: "GW-GM",
          name: "含粉土級配良好礫石",
          description: "含粉土細料的級配良好礫石",
          criteria: ["5% ≤ 細料 ≤ 12%", "符合 GW 標準"],
          properties: ["排水性良好", "強度高", "壓縮性低"],
        }
      } else {
        // Gravels with fines > 12%
        return {
          symbol: "GM",
          name: "粉土質礫石",
          description: "含粉土細料的礫石",
          criteria: ["細料 > 12%", "細料為粉土質"],
          properties: ["排水性尚可", "強度中等", "壓縮性中等"],
        }
      }
    } else {
      // Sands
      if (finesPercent < 5) {
        // Clean sands
        if (uniformityCoefficient >= 6 && coefficientOfCurvature >= 1 && coefficientOfCurvature <= 3) {
          return {
            symbol: "SW",
            name: "級配良好砂",
            description: "級配良好砂，細料含量少或無",
            criteria: ["Cu ≥ 6", "1 ≤ Cc ≤ 3", "細料 < 5%"],
            properties: ["排水性良好", "強度中等", "壓縮性低"],
          }
        } else {
          return {
            symbol: "SP",
            name: "級配不良砂",
            description: "級配不良砂，細料含量少或無",
            criteria: ["不符合 SW 標準", "細料 < 5%"],
            properties: ["排水性良好", "強度低至中等", "壓縮性低"],
          }
        }
      } else {
        // Sands with fines
        return {
          symbol: "SM",
          name: "粉土質砂",
          description: "含粉土細料的砂",
          criteria: ["細料 ≥ 5%", "細料為粉土質"],
          properties: ["排水性尚可", "強度中等", "壓縮性中等"],
        }
      }
    }
  } else {
    // Fine-grained soils (≥ 50% fines)
    return {
      symbol: "ML",
      name: "粉土",
      description: "低塑性無機粉土",
      criteria: ["細料 ≥ 50%", "低塑性"],
      properties: ["排水性不良", "強度低", "壓縮性高"],
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
          name: "石塊碎片、礫石與砂",
          description: "級配良好粒狀材料",
          groupIndex: 0,
          suitability: ["路基材料優良", "基層材料良好", "排水性優良"],
        }
      } else {
        return {
          group: "A-2-4",
          name: "粉土質或黏土質礫石與砂",
          description: "含粉土細料的粒狀材料",
          groupIndex: Math.min(groupIndex, 4),
          suitability: ["路基材料良好至尚可", "基層材料尚可", "排水性良好"],
        }
      }
    } else {
      if (finesPercent <= 10) {
        return {
          group: "A-1-b",
          name: "石塊碎片、礫石與砂",
          description: "級配良好粒狀材料",
          groupIndex: 0,
          suitability: ["路基材料優良", "基層材料良好", "排水性優良"],
        }
      } else {
        return {
          group: "A-3",
          name: "細砂",
          description: "級配不良細砂",
          groupIndex: 0,
          suitability: ["路基材料尚可", "基層材料不良", "排水性良好"],
        }
      }
    }
  } else {
    // Silt-clay materials (> 35% fines)
    if (finesPercent <= 50) {
      return {
        group: "A-4",
        name: "粉土質土壤",
        description: "低塑性粉土質土壤",
        groupIndex: Math.min(groupIndex, 8),
        suitability: ["路基材料尚可至不良", "不適用於基層", "排水性不良"],
      }
    } else {
      return {
        group: "A-6",
        name: "黏土質土壤",
        description: "中塑性黏土質土壤",
        groupIndex: Math.min(groupIndex, 20),
        suitability: ["路基材料不良", "不適用於基層", "排水性極差"],
      }
    }
  }
}
