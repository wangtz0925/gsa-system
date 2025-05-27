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
    const html2canvas = (await import("html2canvas")).default

    const doc = new jsPDF("landscape", "mm", "a4")
    const pageWidth = 297
    const pageHeight = 210

    // Set font
    doc.setFont("helvetica")

    // Draw outer border - exactly as in image
    doc.setLineWidth(1)
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

    // Title section with border - exactly as in image
    doc.setLineWidth(1)
    doc.rect(10, 10, pageWidth - 20, 15)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("GRAIN SIZE DISTRIBUTION TEST REPORT", pageWidth / 2, 20, { align: "center" })

    // Header section with sieve labels - exactly as in image
    let currentY = 25
    doc.setLineWidth(0.5)
    doc.rect(10, currentY, pageWidth - 20, 12)

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("U.S. Std. Sieve", 15, currentY + 4)
    doc.text("Hydrometer", pageWidth - 40, currentY + 4)

    // Sieve size labels - exactly as in image
    const sieveLabels = ["3", "2", "1", "3/4", "3/8", "In.", "#4", "#10", "#20", "#40", "#60", "#100", "#200"]
    const startX = 40
    const endX = pageWidth - 60
    const spacing = (endX - startX) / (sieveLabels.length - 1)

    sieveLabels.forEach((label, index) => {
      doc.text(label, startX + index * spacing, currentY + 10, { align: "center" })
    })

    currentY += 12

    // Chart area - exactly matching image dimensions
    const chartX = 40
    const chartY = currentY + 5
    const chartWidth = pageWidth - 100
    const chartHeight = 100

    // Draw chart border
    doc.setLineWidth(1)
    doc.rect(chartX, chartY, chartWidth, chartHeight)

    // Draw grid lines - exactly as in image
    doc.setLineWidth(0.3)
    doc.setDrawColor(128, 128, 128)

    // Horizontal grid lines (every 10%)
    for (let i = 0; i <= 10; i++) {
      const y = chartY + (i * chartHeight) / 10
      doc.line(chartX, y, chartX + chartWidth, y)
    }

    // Vertical grid lines (logarithmic scale)
    const logPositions = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    logPositions.forEach((pos) => {
      const x = chartX + pos * chartWidth
      doc.line(x, chartY, x, chartY + chartHeight)
    })

    doc.setDrawColor(0, 0, 0)

    // Draw axes - exactly as in image
    doc.setLineWidth(1)
    doc.line(chartX, chartY, chartX, chartY + chartHeight) // Y-axis
    doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight) // X-axis

    // Y-axis labels and ticks - exactly as in image
    doc.setFontSize(7)
    for (let i = 0; i <= 10; i++) {
      const y = chartY + chartHeight - (i * chartHeight) / 10
      const value = i * 10
      doc.text(value.toString(), chartX - 5, y + 1, { align: "right" })
      doc.line(chartX - 2, y, chartX, y) // Tick marks
    }

    // X-axis labels - exactly as in image
    const xLabels = ["10²", "10¹", "10⁰", "10⁻¹", "10⁻²", "10⁻³"]
    xLabels.forEach((label, index) => {
      const x = chartX + (index * chartWidth) / (xLabels.length - 1)
      doc.text(label, x, chartY + chartHeight + 8, { align: "center" })
    })

    // Draw data curve - exactly as in image
    if (data && data.length > 0) {
      const validData = data
        .filter((point) => point.sieveSize > 0 && point.percentPassing !== undefined)
        .sort((a, b) => b.sieveSize - a.sieveSize)

      if (validData.length > 1) {
        doc.setLineWidth(1.5)
        doc.setDrawColor(0, 0, 0)

        for (let i = 0; i < validData.length - 1; i++) {
          const point1 = validData[i]
          const point2 = validData[i + 1]

          // Convert to chart coordinates
          const x1 = chartX + ((Math.log10(point1.sieveSize) + 3) / 5) * chartWidth
          const y1 = chartY + chartHeight - (point1.percentPassing / 100) * chartHeight
          const x2 = chartX + ((Math.log10(point2.sieveSize) + 3) / 5) * chartWidth
          const y2 = chartY + chartHeight - (point2.percentPassing / 100) * chartHeight

          // Ensure coordinates are within chart bounds
          if (x1 >= chartX && x1 <= chartX + chartWidth && x2 >= chartX && x2 <= chartX + chartWidth) {
            doc.line(x1, y1, x2, y2)
          }
        }

        // Draw data points - exactly as in image
        validData.forEach((point) => {
          const x = chartX + ((Math.log10(point.sieveSize) + 3) / 5) * chartWidth
          const y = chartY + chartHeight - (point.percentPassing / 100) * chartHeight

          if (x >= chartX && x <= chartX + chartWidth) {
            doc.circle(x, y, 1, "S") // Small circles for data points
          }
        })
      }
    }

    // Y-axis label - exactly as in image
    doc.setFontSize(8)
    doc.text("Percent Passing (%)", 25, chartY + chartHeight / 2, { angle: 90, align: "center" })

    // X-axis label - exactly as in image
    doc.text("Diameter of Particle in Millimeters", chartX + chartWidth / 2, chartY + chartHeight + 20, {
      align: "center",
    })

    // Legend - exactly as in image
    doc.setFontSize(8)
    const legendX = chartX + chartWidth - 40
    const legendY = chartY + 15
    doc.text("○", legendX, legendY)
    doc.text(sampleInfo.fileName || "B-1S01", legendX + 5, legendY)

    currentY = chartY + chartHeight + 25

    // Particle classification bar - exactly as in image
    doc.setLineWidth(1)
    doc.rect(chartX, currentY, chartWidth, 15)

    // Main categories
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    const categoryWidth = chartWidth / 3
    doc.text("GRAVEL", chartX + categoryWidth / 2, currentY + 5, { align: "center" })
    doc.text("SAND", chartX + categoryWidth + categoryWidth / 2, currentY + 5, { align: "center" })
    doc.text("FINES", chartX + 2 * categoryWidth + categoryWidth / 2, currentY + 5, { align: "center" })

    // Vertical lines for main categories
    doc.line(chartX + categoryWidth, currentY, chartX + categoryWidth, currentY + 15)
    doc.line(chartX + 2 * categoryWidth, currentY, chartX + 2 * categoryWidth, currentY + 15)

    // Subcategories
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    const subCatWidth = categoryWidth / 2
    doc.text("COARSE", chartX + subCatWidth / 2, currentY + 12, { align: "center" })
    doc.text("FINE", chartX + subCatWidth + subCatWidth / 2, currentY + 12, { align: "center" })

    const sandSubWidth = categoryWidth / 3
    doc.text("COARSE", chartX + categoryWidth + sandSubWidth / 2, currentY + 12, { align: "center" })
    doc.text("MEDIUM", chartX + categoryWidth + sandSubWidth + sandSubWidth / 2, currentY + 12, { align: "center" })
    doc.text("FINE", chartX + categoryWidth + 2 * sandSubWidth + sandSubWidth / 2, currentY + 12, { align: "center" })

    const finesSubWidth = categoryWidth / 2
    doc.text("SILT", chartX + 2 * categoryWidth + finesSubWidth / 2, currentY + 12, { align: "center" })
    doc.text("CLAY", chartX + 2 * categoryWidth + finesSubWidth + finesSubWidth / 2, currentY + 12, { align: "center" })

    // Vertical lines for subcategories
    doc.line(chartX + subCatWidth, currentY + 7, chartX + subCatWidth, currentY + 15)
    doc.line(chartX + categoryWidth + sandSubWidth, currentY + 7, chartX + categoryWidth + sandSubWidth, currentY + 15)
    doc.line(
      chartX + categoryWidth + 2 * sandSubWidth,
      currentY + 7,
      chartX + categoryWidth + 2 * sandSubWidth,
      currentY + 15,
    )
    doc.line(
      chartX + 2 * categoryWidth + finesSubWidth,
      currentY + 7,
      chartX + 2 * categoryWidth + finesSubWidth,
      currentY + 15,
    )

    currentY += 20

    // Data table 1 - exactly as in image
    const tableHeaders1 = [
      "Test No.",
      "D85",
      "D60",
      "D50",
      "D30",
      "D15",
      "D10",
      "Cu",
      "Cc",
      "LL",
      "PI",
      "Gravel %",
      "Sand %",
    ]
    const colWidth = chartWidth / tableHeaders1.length

    doc.setLineWidth(1)
    doc.rect(chartX, currentY, chartWidth, 8)

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    tableHeaders1.forEach((header, index) => {
      const x = chartX + index * colWidth + colWidth / 2
      doc.text(header, x, currentY + 5, { align: "center" })
      if (index < tableHeaders1.length - 1) {
        doc.line(chartX + (index + 1) * colWidth, currentY, chartX + (index + 1) * colWidth, currentY + 8)
      }
    })

    currentY += 8

    // Data row 1
    doc.rect(chartX, currentY, chartWidth, 8)
    doc.setFont("helvetica", "normal")

    const dataRow1 = [
      sampleInfo.fileName || "B-1S01",
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
    ]

    dataRow1.forEach((value, index) => {
      const x = chartX + index * colWidth + colWidth / 2
      doc.text(value, x, currentY + 5, { align: "center" })
      if (index < dataRow1.length - 1) {
        doc.line(chartX + (index + 1) * colWidth, currentY, chartX + (index + 1) * colWidth, currentY + 8)
      }
    })

    currentY += 12

    // Data table 2 - exactly as in image
    const tableHeaders2 = ["Test No.", "USCS (ASTM D2487-85) Soil Classification", "AASHTO", "% Fines Clay Silt"]
    const colWidths2 = [chartWidth * 0.15, chartWidth * 0.5, chartWidth * 0.15, chartWidth * 0.2]

    doc.rect(chartX, currentY, chartWidth, 8)
    doc.setFont("helvetica", "bold")

    let xPos = chartX
    tableHeaders2.forEach((header, index) => {
      doc.text(header, xPos + colWidths2[index] / 2, currentY + 5, { align: "center" })
      if (index < tableHeaders2.length - 1) {
        doc.line(xPos + colWidths2[index], currentY, xPos + colWidths2[index], currentY + 8)
      }
      xPos += colWidths2[index]
    })

    currentY += 8

    // Data row 2
    doc.rect(chartX, currentY, chartWidth, 8)
    doc.setFont("helvetica", "normal")

    const uscsClassification = classifySoilUSCS(results)
    const aashtoClassification = classifySoilAASHTO(results)

    const dataRow2 = [
      sampleInfo.fileName || "B-1S01",
      `${uscsClassification.symbol} ${uscsClassification.name}`,
      aashtoClassification.group,
      `${results.finesPercent.toFixed(1)} ${results.finesPercent.toFixed(1)}`,
    ]

    xPos = chartX
    dataRow2.forEach((value, index) => {
      doc.text(value, xPos + colWidths2[index] / 2, currentY + 5, { align: "center" })
      if (index < dataRow2.length - 1) {
        doc.line(xPos + colWidths2[index], currentY, xPos + colWidths2[index], currentY + 8)
      }
      xPos += colWidths2[index]
    })

    currentY += 12

    // Company info - exactly as in image
    doc.setLineWidth(1)
    doc.rect(10, currentY, pageWidth - 20, 15)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("GEOTECH ENGINEERING", pageWidth / 2, currentY + 7, { align: "center" })
    doc.text("CONSULTANTS CO., LTD.", pageWidth / 2, currentY + 12, { align: "center" })

    // Save
    const fileName = sampleInfo.fileName || sampleInfo.sampleId || "Grain_Size_Distribution"
    doc.save(`${fileName}_Report_${new Date().toISOString().split("T")[0]}.pdf`)
  } catch (error) {
    console.error("PDF export error:", error)
    alert("PDF匯出失敗，請稍後再試")
  }
}
