// Chart export utilities
export async function exportChartAsPNG(chartId: string, sampleId: string) {
  try {
    // Dynamic import to avoid SSR issues
    const html2canvas = (await import("html2canvas")).default

    const chartElement = document.getElementById(chartId)
    if (!chartElement) {
      alert("找不到圖表元素")
      return
    }

    // Create canvas from the chart element
    const canvas = await html2canvas(chartElement, {
      backgroundColor: "#ffffff",
      scale: 2, // Higher resolution
      logging: false,
      useCORS: true,
    })

    // Create download link
    const link = document.createElement("a")
    link.download = `粒徑分布曲線_${sampleId || "Sample"}_${new Date().toISOString().split("T")[0]}.png`
    link.href = canvas.toDataURL("image/png")

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("Chart export error:", error)
    alert("圖表匯出失敗，請稍後再試")
  }
}

// Export chart data as CSV
export function exportChartDataAsCSV(data: any[], sampleId: string) {
  try {
    const csvHeader = "篩網尺寸(mm),通過百分比(%)\n"
    const csvData = data
      .filter((item) => item.sieveSize > 0)
      .sort((a, b) => b.sieveSize - a.sieveSize)
      .map((item) => `${item.sieveSize},${item.percentPassing.toFixed(1)}`)
      .join("\n")

    const csvContent = csvHeader + csvData

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `粒徑分布數據_${sampleId || "Sample"}_${new Date().toISOString().split("T")[0]}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("CSV export error:", error)
    alert("CSV 匯出失敗，請稍後再試")
  }
}
