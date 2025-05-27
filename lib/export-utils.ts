import type { SieveData, AnalysisResults, TemperatureData } from "@/types/sieve-analysis"

// PDF Export using jsPDF with proper encoding
export async function exportToPDF(
  data: SieveData[],
  results: AnalysisResults,
  sampleInfo: any,
  temperatureData?: TemperatureData | null,
) {
  try {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF()

    // Set font for better character support
    doc.setFont("helvetica")

    // Header - Use English title to avoid encoding issues
    doc.setFontSize(20)
    doc.text("GRAIN SIZE DISTRIBUTION TEST REPORT", 105, 20, { align: "center" })

    doc.setFontSize(12)
    doc.text("Geotechnical Sieve Analysis Test Report", 105, 30, { align: "center" })

    // File name
    if (sampleInfo.fileName) {
      doc.setFontSize(14)
      doc.text(`File Name: ${sampleInfo.fileName}`, 20, 45)
    }

    // Sample Information
    doc.setFontSize(14)
    doc.text("Sample Information", 20, 60)

    doc.setFontSize(10)
    const sampleInfoText = [
      `Total Mass: ${sampleInfo.totalMass} g`,
      `Specific gravity: ${sampleInfo.specificGravity || "N/A"}`,
      `Liquid limit (LL): ${sampleInfo.liquidLimit || "N/A"}%`,
      `Plastic limit (PL): ${sampleInfo.plasticLimit || "N/A"}%`,
      `Test Date: ${sampleInfo.date}`,
    ]

    if (sampleInfo.sampleId) sampleInfoText.unshift(`Sample ID: ${sampleInfo.sampleId}`)
    if (sampleInfo.location) sampleInfoText.unshift(`Location: ${sampleInfo.location}`)
    if (sampleInfo.depth) sampleInfoText.unshift(`Depth: ${sampleInfo.depth} m`)

    sampleInfoText.forEach((text, index) => {
      doc.text(text, 20, 70 + index * 8)
    })

    // Method Information
    const methodStartY = 70 + sampleInfoText.length * 8 + 10
    doc.setFontSize(12)
    doc.text("Test Method", 20, methodStartY)
    doc.setFontSize(10)
    doc.text("Input data method: Wt. retained", 20, methodStartY + 10)
    doc.text("Type of Hydrometer used: 151H", 20, methodStartY + 18)

    // Temperature data if available
    if (temperatureData) {
      doc.text("Hydrometer Analysis Conditions:", 20, methodStartY + 30)
      doc.text(`Temperature: ${temperatureData.temperature} C`, 20, methodStartY + 38)
      doc.text(`Specimen Weight (passing #200): ${temperatureData.specimenWeight.toFixed(4)} g`, 20, methodStartY + 46)
    }

    // Key Parameters
    doc.setFontSize(14)
    doc.text("Key Gradation Parameters", 20, methodStartY + 60)

    doc.setFontSize(10)
    const keyParams = [
      `D10: ${results.d10.toFixed(3)} mm`,
      `D30: ${results.d30.toFixed(3)} mm`,
      `D60: ${results.d60.toFixed(3)} mm`,
      `Cu: ${results.uniformityCoefficient.toFixed(2)}`,
      `Cc: ${results.coefficientOfCurvature.toFixed(2)}`,
      `Gravel: ${results.gravelPercent.toFixed(1)}%`,
      `Sand: ${results.sandPercent.toFixed(1)}%`,
      `Fines: ${results.finesPercent.toFixed(1)}%`,
    ]

    // Arrange in two columns
    keyParams.forEach((param, index) => {
      const x = index < 4 ? 20 : 120
      const y = methodStartY + 70 + (index % 4) * 8
      doc.text(param, x, y)
    })

    // Detailed Results Table
    doc.setFontSize(14)
    doc.text("Detailed Sieve Analysis Results", 20, methodStartY + 110)

    const tableData = data
      .filter((sieve) => sieve.massRetained > 0 || sieve.sieveSize >= 0.075)
      .sort((a, b) => b.sieveSize - a.sieveSize)
      .map((sieve) => [
        sieve.sieveOpening,
        sieve.sieveSize.toString(),
        sieve.massRetained.toFixed(1),
        sieve.cumulativeMassRetained.toFixed(1),
        sieve.percentRetained.toFixed(1) + "%",
        sieve.cumulativePercentRetained.toFixed(1) + "%",
        sieve.percentPassing.toFixed(1) + "%",
      ])

    // Add pan row
    tableData.push([
      "Pan",
      "<0.075",
      results.panMass.toFixed(1),
      results.totalMassRetained.toFixed(1),
      ((results.panMass / results.totalMassRetained) * 100).toFixed(1) + "%",
      "100.0%",
      "0.0%",
    ])

    autoTable(doc, {
      head: [
        [
          "Sieve Opening",
          "Sieve Size\n(mm)",
          "Mass Retained\n(g)",
          "Cumulative\nMass Retained(g)",
          "Percent\nRetained",
          "Cumulative\nPercent Retained",
          "Percent\nPassing",
        ],
      ],
      body: tableData,
      startY: methodStartY + 120,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 10, right: 10 },
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" })
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 285)
    }

    // Save the PDF
    const fileName = sampleInfo.fileName || "Sieve_Analysis_Report"
    doc.save(`${fileName}_${new Date().toISOString().split("T")[0]}.pdf`)
  } catch (error) {
    console.error("PDF export error:", error)
    alert("PDF 匯出失敗，請稍後再試")
  }
}

// Excel Export using SheetJS
export async function exportToExcel(
  data: SieveData[],
  results: AnalysisResults,
  sampleInfo: any,
  temperatureData?: TemperatureData | null,
) {
  try {
    // Dynamic import to avoid SSR issues
    const XLSX = await import("xlsx")

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Sample Information Sheet
    const sampleInfoData = [
      ["Item", "Value"],
      ["File Name", sampleInfo.fileName || ""],
      ["Total Mass (g)", sampleInfo.totalMass || ""],
      ["Specific gravity", sampleInfo.specificGravity || ""],
      ["Liquid limit (LL) (%)", sampleInfo.liquidLimit || ""],
      ["Plastic limit (PL) (%)", sampleInfo.plasticLimit || ""],
      ["Test Date", sampleInfo.date],
      [""],
      ["Test Method", ""],
      ["Input data method", "Wt. retained"],
      ["Type of Hydrometer used", "151H"],
      [""],
      ["Key Parameters", "Value"],
      ["D10 (mm)", results.d10.toFixed(3)],
      ["D30 (mm)", results.d30.toFixed(3)],
      ["D60 (mm)", results.d60.toFixed(3)],
      ["Effective Size (mm)", results.effectiveSize.toFixed(3)],
      ["Uniformity Coefficient Cu", results.uniformityCoefficient.toFixed(2)],
      ["Coefficient of Curvature Cc", results.coefficientOfCurvature.toFixed(2)],
      ["Gravel Percent (%)", results.gravelPercent.toFixed(1)],
      ["Sand Percent (%)", results.sandPercent.toFixed(1)],
      ["Fines Percent (%)", results.finesPercent.toFixed(1)],
    ]

    // Add optional fields if they exist
    if (sampleInfo.sampleId) {
      sampleInfoData.splice(2, 0, ["Sample ID", sampleInfo.sampleId])
    }
    if (sampleInfo.location) {
      sampleInfoData.splice(sampleInfo.sampleId ? 3 : 2, 0, ["Location", sampleInfo.location])
    }
    if (sampleInfo.depth) {
      const insertIndex = (sampleInfo.sampleId ? 1 : 0) + (sampleInfo.location ? 1 : 0) + 2
      sampleInfoData.splice(insertIndex, 0, ["Depth (m)", sampleInfo.depth])
    }

    // Add temperature data if available
    if (temperatureData) {
      sampleInfoData.push(
        [""],
        ["Hydrometer Analysis", ""],
        ["Specimen Weight (passing #200) (g)", temperatureData.specimenWeight.toFixed(4)],
        ["Temperature (°C)", temperatureData.temperature],
        ["Meniscus Correction", temperatureData.meniscusCorrection],
        ["Dispersant Correction", temperatureData.dispersantCorrection],
      )
    }

    const sampleInfoWS = XLSX.utils.aoa_to_sheet(sampleInfoData)
    XLSX.utils.book_append_sheet(wb, sampleInfoWS, "Sample Info")

    // Detailed Results Sheet
    const detailedResultsHeader = [
      "Sieve Opening",
      "Sieve Size (mm)",
      "Mass Retained (g)",
      "Cumulative Mass Retained (g)",
      "Percent Retained (%)",
      "Cumulative Percent Retained (%)",
      "Percent Passing (%)",
    ]

    const detailedResultsData = [
      detailedResultsHeader,
      ...data
        .filter((sieve) => sieve.massRetained > 0 || sieve.sieveSize >= 0.075)
        .sort((a, b) => b.sieveSize - a.sieveSize)
        .map((sieve) => [
          sieve.sieveOpening,
          sieve.sieveSize,
          Number.parseFloat(sieve.massRetained.toFixed(1)),
          Number.parseFloat(sieve.cumulativeMassRetained.toFixed(1)),
          Number.parseFloat(sieve.percentRetained.toFixed(1)),
          Number.parseFloat(sieve.cumulativePercentRetained.toFixed(1)),
          Number.parseFloat(sieve.percentPassing.toFixed(1)),
        ]),
      [
        "Pan",
        "<0.075",
        Number.parseFloat(results.panMass.toFixed(1)),
        Number.parseFloat(results.totalMassRetained.toFixed(1)),
        Number.parseFloat(((results.panMass / results.totalMassRetained) * 100).toFixed(1)),
        100.0,
        0.0,
      ],
    ]

    const detailedResultsWS = XLSX.utils.aoa_to_sheet(detailedResultsData)

    // Set column widths
    detailedResultsWS["!cols"] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
    ]

    XLSX.utils.book_append_sheet(wb, detailedResultsWS, "Detailed Results")

    // Temperature data sheet if available
    if (temperatureData) {
      const tempDataHeader = ["Time (min)", "Hydrometer Reading"]
      const tempData = [
        tempDataHeader,
        ...Object.entries(temperatureData.hydrometerReadings).map(([time, reading]) => [
          Number.parseInt(time),
          reading,
        ]),
      ]

      const tempDataWS = XLSX.utils.aoa_to_sheet(tempData)
      XLSX.utils.book_append_sheet(wb, tempDataWS, "Hydrometer Data")
    }

    // Generate binary string
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

    // Create blob and download
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    const fileName = sampleInfo.fileName || "Sieve_Analysis_Data"
    link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Excel export error:", error)
    alert("Excel 匯出失敗，請稍後再試")
  }
}

// GSA Format Export
export function exportToGSA(
  data: SieveData[],
  results: AnalysisResults,
  sampleInfo: any,
  temperatureData?: TemperatureData | null,
) {
  try {
    const gsaData = {
      version: "1.0",
      fileInfo: {
        fileName: sampleInfo.fileName || "",
        sampleId: sampleInfo.sampleId || "",
        location: sampleInfo.location || "",
        depth: sampleInfo.depth || "",
        testDate: sampleInfo.date,
        totalMass: Number.parseFloat(sampleInfo.totalMass) || 0,
        specificGravity: Number.parseFloat(sampleInfo.specificGravity) || 0,
        liquidLimit: Number.parseFloat(sampleInfo.liquidLimit) || 0,
        plasticLimit: Number.parseFloat(sampleInfo.plasticLimit) || 0,
      },
      testMethod: {
        inputDataMethod: "Wt. retained",
        hydrometerType: "151H",
      },
      sieveData: data.map((sieve) => ({
        sieveSize: sieve.sieveSize,
        sieveOpening: sieve.sieveOpening,
        massRetained: sieve.massRetained,
        cumulativeMassRetained: sieve.cumulativeMassRetained,
        percentRetained: sieve.percentRetained,
        cumulativePercentRetained: sieve.cumulativePercentRetained,
        percentPassing: sieve.percentPassing,
      })),
      analysisResults: {
        d10: results.d10,
        d30: results.d30,
        d60: results.d60,
        effectiveSize: results.effectiveSize,
        uniformityCoefficient: results.uniformityCoefficient,
        coefficientOfCurvature: results.coefficientOfCurvature,
        gravelPercent: results.gravelPercent,
        sandPercent: results.sandPercent,
        finesPercent: results.finesPercent,
        totalMassRetained: results.totalMassRetained,
        panMass: results.panMass,
      },
      temperatureData: temperatureData || null,
      exportDate: new Date().toISOString(),
    }

    const jsonString = JSON.stringify(gsaData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    const fileName = sampleInfo.fileName || "GSA_Analysis"
    link.download = `${fileName}.gsa`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("GSA export error:", error)
    alert("GSA 格式匯出失敗，請稍後再試")
  }
}

export async function exportChartAsPNG(elementId: string, filename = "grain-size-distribution") {
  try {
    const html2canvas = (await import("html2canvas")).default
    const element = document.getElementById(elementId)

    if (!element) {
      throw new Error("Chart element not found")
    }

    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    })

    const link = document.createElement("a")
    link.download = `${filename}.png`
    link.href = canvas.toDataURL("image/png")

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("PNG export failed:", error)
    alert("PNG export failed. Please try again.")
  }
}

export async function exportChartAsPDF() {
  try {
    const response = await fetch("/api/export-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("PDF generation failed")
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "grain-size-distribution-report.pdf"
    link.click()

    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("PDF export failed:", error)
    alert("PDF export failed. Please try again.")
  }
}
