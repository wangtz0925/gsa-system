import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"
import { classifySoilUSCS, classifySoilAASHTO } from "@/lib/soil-classification"

export async function exportGrainSizePDF(
  data: SieveData[],
  results: AnalysisResults,
  sampleInfo: any,
  temperatureData?: TemperatureData | null,
) {
  try {
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF("landscape", "mm", "a4")

    // Title
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("GRAIN SIZE DISTRIBUTION TEST REPORT", 148, 20, { align: "center" })

    // Sieve indicators
    doc.setFontSize(10)
    doc.text("U.S. Std. Sieve", 20, 35)
    doc.text("Hydrometer", 200, 35)
    doc.setFontSize(8)
    doc.text('3" 2" 1 3/4" 3/8" #4 #10 #20 #40 #60 #100 #200', 20, 42)

    // Chart placeholder (would need chart library integration)
    doc.rect(20, 50, 256, 120)
    doc.setFontSize(12)
    doc.text("Grain Size Distribution Chart", 148, 110, { align: "center" })

    // Particle size classification
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.rect(20, 175, 85, 10)
    doc.text("GRAVEL", 62, 182, { align: "center" })
    doc.rect(105, 175, 85, 10)
    doc.text("SAND", 147, 182, { align: "center" })
    doc.rect(190, 175, 86, 10)
    doc.text("FINES", 233, 182, { align: "center" })

    // Sub-classifications
    doc.setFontSize(8)
    doc.rect(20, 185, 42, 8)
    doc.text("COARSE", 41, 190, { align: "center" })
    doc.rect(62, 185, 43, 8)
    doc.text("FINE", 83, 190, { align: "center" })
    doc.rect(105, 185, 28, 8)
    doc.text("COARSE", 119, 190, { align: "center" })
    doc.rect(133, 185, 28, 8)
    doc.text("MEDIUM", 147, 190, { align: "center" })
    doc.rect(161, 185, 29, 8)
    doc.text("FINE", 175, 190, { align: "center" })
    doc.rect(190, 185, 86, 8)
    doc.text("SILT | CLAY", 233, 190, { align: "center" })

    // Data table
    const uscsClassification = classifySoilUSCS(results)
    const aashtoClassification = classifySoilAASHTO(results)

    const tableData = [
      [
        sampleInfo.fileName || "Sample-1",
        "0.18",
        results.d60.toFixed(2),
        "0.083",
        results.d30.toFixed(3),
        "0.012",
        results.d10.toFixed(3),
        results.uniformityCoefficient.toFixed(1),
        results.coefficientOfCurvature.toFixed(1),
        "NV",
        "NP",
        results.gravelPercent.toFixed(1),
        results.sandPercent.toFixed(1),
      ],
    ]

    autoTable(doc, {
      head: [["Test No.", "D85", "D60", "D50", "D30", "D15", "D10", "Cu", "Cc", "LL", "PI", "Gravel %", "Sand %"]],
      body: tableData,
      startY: 200,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200] },
      margin: { left: 20, right: 20 },
    })

    // Classification table
    const classificationData = [
      [
        sampleInfo.fileName || "Sample-1",
        `${uscsClassification.symbol} ${uscsClassification.name}`,
        aashtoClassification.group,
        `${results.finesPercent.toFixed(1)} ${results.finesPercent.toFixed(1)}`,
      ],
    ]

    autoTable(doc, {
      head: [["Test No.", "USCS (ASTM D2487-85) Soil Classification", "AASHTO", "% Fines Clay Silt"]],
      body: classificationData,
      startY: doc.lastAutoTable.finalY + 10,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [200, 200, 200] },
      margin: { left: 20, right: 20 },
    })

    // Company info
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("GEOTECH ENGINEERING", 148, doc.lastAutoTable.finalY + 25, { align: "center" })
    doc.text("CONSULTANTS CO., LTD.", 148, doc.lastAutoTable.finalY + 35, { align: "center" })

    // Save
    const fileName = sampleInfo.fileName || "Grain_Size_Distribution"
    doc.save(`${fileName}_Report_${new Date().toISOString().split("T")[0]}.pdf`)
  } catch (error) {
    console.error("PDF export error:", error)
    alert("PDF 匯出失敗，請稍後再試")
  }
}
