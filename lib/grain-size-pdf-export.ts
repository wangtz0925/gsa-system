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
    const html2canvas = (await import("html2canvas")).default

    const doc = new jsPDF("portrait", "mm", "a4")

    // Title
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.rect(20, 15, 170, 15)
    doc.text("GRAIN SIZE DISTRIBUTION TEST REPORT", 95, 25, { align: "center" })

    // Sieve indicators
    doc.setFontSize(10)
    doc.text("U.S. Std. Sieve", 20, 40)
    doc.text("Hydrometer", 130, 40)
    doc.setFontSize(8)
    doc.text('3" 2" 1 3/4" 3/8" #4 #10 #20 #40 #60 #100 #200', 20, 47)

    // Capture chart as image
    const chartElement = document.getElementById("grain-size-chart")
    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: "#ffffff",
          scale: 1,
          logging: false,
          useCORS: true,
        })

        const imgData = canvas.toDataURL("image/png")
        doc.addImage(imgData, "PNG", 20, 55, 170, 80)
      } catch (error) {
        console.warn("Could not capture chart, using placeholder")
        doc.rect(20, 55, 170, 80)
        doc.text("Chart Image", 95, 95, { align: "center" })
      }
    } else {
      doc.rect(20, 55, 170, 80)
      doc.text("Chart Image", 95, 95, { align: "center" })
    }

    // Particle size classification
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.rect(20, 135, 56.66, 8)
    doc.text("GRAVEL", 48.33, 141, { align: "center" })
    doc.rect(76.66, 135, 56.66, 8)
    doc.text("SAND", 105, 141, { align: "center" })
    doc.rect(133.32, 135, 56.68, 8)
    doc.text("FINES", 161.66, 141, { align: "center" })

    // Sub-classifications
    doc.setFontSize(8)
    doc.rect(20, 143, 28.33, 6)
    doc.text("COARSE", 34.16, 147, { align: "center" })
    doc.rect(48.33, 143, 28.33, 6)
    doc.text("FINE", 62.49, 147, { align: "center" })
    doc.rect(76.66, 143, 18.88, 6)
    doc.text("COARSE", 86.1, 147, { align: "center" })
    doc.rect(95.54, 143, 18.88, 6)
    doc.text("MEDIUM", 104.98, 147, { align: "center" })
    doc.rect(114.42, 143, 18.88, 6)
    doc.text("FINE", 123.86, 147, { align: "center" })
    doc.rect(133.32, 143, 56.68, 6)
    doc.text("SILT | CLAY", 161.66, 147, { align: "center" })

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
      startY: 155,
      styles: { fontSize: 6, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0] },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.5,
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
      startY: doc.lastAutoTable.finalY + 5,
      styles: { fontSize: 6, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.5 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0] },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.5,
      margin: { left: 20, right: 20 },
    })

    // Company info
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.rect(20, doc.lastAutoTable.finalY + 10, 170, 15)
    doc.text("GEOTECH ENGINEERING", 95, doc.lastAutoTable.finalY + 18, { align: "center" })
    doc.text("CONSULTANTS CO., LTD.", 95, doc.lastAutoTable.finalY + 23, { align: "center" })

    // Save
    const fileName = sampleInfo.fileName || "Grain_Size_Distribution"
    doc.save(`${fileName}_Report_${new Date().toISOString().split("T")[0]}.pdf`)
  } catch (error) {
    console.error("PDF export error:", error)
    alert("PDF export failed, please try again later")
  }
}
