import type { AnalysisResults } from "@/types/sieve-analysis"
import { classifySoilUSCS, classifySoilAASHTO } from "@/lib/soil-classification"

export async function exportClassificationReport(results: AnalysisResults) {
  try {
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()
    const uscsClassification = classifySoilUSCS(results)
    const aashtoClassification = classifySoilAASHTO(results)

    // Header
    doc.setFontSize(18)
    doc.text("土壤分類報告", 105, 20, { align: "center" })
    doc.text("Soil Classification Report", 105, 30, { align: "center" })

    // USCS Classification
    doc.setFontSize(14)
    doc.text("USCS 分類 (統一土壤分類系統)", 20, 50)

    doc.setFontSize(12)
    doc.text(`分類符號: ${uscsClassification.symbol}`, 20, 65)
    doc.text(`土壤名稱: ${uscsClassification.name}`, 20, 75)
    doc.text(`描述: ${uscsClassification.description}`, 20, 85)

    doc.setFontSize(10)
    doc.text("分類標準:", 20, 100)
    uscsClassification.criteria.forEach((criterion, index) => {
      doc.text(`• ${criterion}`, 25, 110 + index * 8)
    })

    const criteriaEndY = 110 + uscsClassification.criteria.length * 8
    doc.text("工程性質:", 20, criteriaEndY + 10)
    uscsClassification.properties.forEach((property, index) => {
      doc.text(`• ${property}`, 25, criteriaEndY + 20 + index * 8)
    })

    // AASHTO Classification
    const aashtoStartY = criteriaEndY + 20 + uscsClassification.properties.length * 8 + 20
    doc.setFontSize(14)
    doc.text("AASHTO 分類", 20, aashtoStartY)

    doc.setFontSize(12)
    doc.text(`群組: ${aashtoClassification.group}`, 20, aashtoStartY + 15)
    doc.text(`名稱: ${aashtoClassification.name}`, 20, aashtoStartY + 25)
    doc.text(`群組指數: ${aashtoClassification.groupIndex}`, 20, aashtoStartY + 35)

    doc.setFontSize(10)
    doc.text("適用性:", 20, aashtoStartY + 50)
    aashtoClassification.suitability.forEach((item, index) => {
      doc.text(`• ${item}`, 25, aashtoStartY + 60 + index * 8)
    })

    // Summary
    const summaryStartY = aashtoStartY + 60 + aashtoClassification.suitability.length * 8 + 20
    doc.setFontSize(14)
    doc.text("分類摘要", 20, summaryStartY)

    doc.setFontSize(10)
    const gradation =
      results.uniformityCoefficient > 4 && results.coefficientOfCurvature > 1 && results.coefficientOfCurvature < 3
        ? "級配良好"
        : "級配不良"

    const summaryData = [
      `主要分類: ${uscsClassification.symbol} - ${uscsClassification.name}`,
      `AASHTO 群組: ${aashtoClassification.group} (GI = ${aashtoClassification.groupIndex})`,
      `級配評估: ${gradation}`,
      `均勻係數 Cu: ${results.uniformityCoefficient.toFixed(2)}`,
      `曲率係數 Cc: ${results.coefficientOfCurvature.toFixed(2)}`,
      `顆粒組成: 礫石 ${results.gravelPercent.toFixed(1)}%, 砂 ${results.sandPercent.toFixed(1)}%, 細料 ${results.finesPercent.toFixed(1)}%`,
    ]

    summaryData.forEach((item, index) => {
      doc.text(item, 20, summaryStartY + 15 + index * 10)
    })

    // Footer
    doc.setFontSize(8)
    doc.text(`報告產生時間: ${new Date().toLocaleString("zh-TW")}`, 20, 280)
    doc.text("第 1 頁，共 1 頁", 105, 285, { align: "center" })

    // Save
    doc.save(`土壤分類報告_${new Date().toISOString().split("T")[0]}.pdf`)
  } catch (error) {
    console.error("Classification report export error:", error)
    alert("分類報告匯出失敗，請稍後再試")
  }
}
