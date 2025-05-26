import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import type { AnalysisResults } from "@/types/sieve-analysis"

export async function exportGrainSizePDF(
  chartElement: HTMLElement,
  sampleId: string,
  results: AnalysisResults
) {
  const canvas = await html2canvas(chartElement)
  const imgData = canvas.toDataURL("image/png")
  const pdf = new jsPDF("portrait", "mm", "a4")

  // 頁首標題
  pdf.setFontSize(16)
  pdf.text("Grain Size Distribution Test Report", 105, 15, { align: "center" })

  // 插入圖表圖片（寬度190mm，高度預估105mm）
  pdf.addImage(imgData, "PNG", 10, 20, 190, 105)

  // 表格標題
  pdf.setFontSize(12)
  pdf.text("Analysis Summary", 10, 135)

  // 表格內容設定
  let y = 142
  const lineHeight = 6
  const labelX = 15
  const valueX = 60

  const rows = [
    ["Sample", sampleId],
    ["D85", results.D85?.toFixed(3) || "-"],
    ["D60", results.D60?.toFixed(3) || "-"],
    ["D50", results.D50?.toFixed(3) || "-"],
    ["D30", results.D30?.toFixed(3) || "-"],
    ["D15", results.D15?.toFixed(3) || "-"],
    ["D10", results.D10?.toFixed(3) || "-"],
    ["Cu", results.Cu?.toFixed(2) || "-"],
    ["Cc", results.Cc?.toFixed(2) || "-"],
    ["USCS", results.USCS || "-"],
    ["AASHTO", results.AASHTO || "-"],
    ["LL", results.LL ?? "–"],
    ["PI", results.PI ?? "–"],
    ["% Gravel", results.percentGravel?.toFixed(1) || "-"],
    ["% Sand", results.percentSand?.toFixed(1) || "-"]
  ]

  rows.forEach(([label, value]) => {
    pdf.text(label, labelX, y)
    pdf.text(String(value), valueX, y)
    y += lineHeight
  })

  pdf.save(`grain-size-${sampleId}.pdf`)
}
