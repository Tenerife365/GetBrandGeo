import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PageAnalysis, DashboardStats } from '../types'

interface ExportOptions {
  analyses: PageAnalysis[]
  stats: DashboardStats | null
  competitorData: { name: string; count: number; avgScore: number }[]
}

export async function exportPDF({ analyses, stats, competitorData }: ExportOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const now = new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })

  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 38, 'F')
  doc.setTextColor(31, 155, 170)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('BrandGEO', 14, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('GEO Visibility Report', 14, 23)
  doc.text(`Generated: ${now}`, 14, 29)

  if (stats) {
    let x = 14
    const kpis = [
      { label: 'Pages Analyzed', value: String(stats.totalAnalyzed) },
      { label: 'Avg GEO Score',  value: String(stats.avgGeoScore) },
      { label: 'Brand Mentions', value: String(stats.mentionsCount) },
      { label: 'Competitor Opps', value: String(stats.competitorOpportunities) },
    ]
    const boxW = (W - 28 - 9) / 4
    kpis.forEach((kpi, i) => {
      doc.setFillColor(30, 41, 59)
      doc.roundedRect(x + i * (boxW + 3), 44, boxW, 22, 2, 2, 'F')
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(kpi.value, x + i * (boxW + 3) + boxW / 2, 53, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text(kpi.label.toUpperCase(), x + i * (boxW + 3) + boxW / 2, 60, { align: 'center' })
    })
  }

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(203, 213, 225)
  doc.text('Analyzed Pages', 14, 76)

  autoTable(doc, {
    startY: 80,
    head: [['Page Title', 'Classification', 'Sentiment', 'GEO Score', 'Priority']],
    body: analyses.slice(0, 20).map(a => [
      (a.title || a.url || '').substring(0, 55),
      a.classification.replace(/_/g, ' '),
      a.sentiment,
      String(a.geo_score),
      String(a.action_priority),
    ]),
    styles: { fontSize: 8, cellPadding: 3, textColor: [203, 213, 225], fillColor: [15, 23, 42], lineColor: [51, 65, 85], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: [148, 163, 184], fontStyle: 'bold', fontSize: 7 },
    columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 35 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22, halign: 'center' }, 4: { cellWidth: 18, halign: 'center' } },
  })

  if (competitorData.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(203, 213, 225)
    doc.text('Competitor Appearances', 14, finalY)
    autoTable(doc, {
      startY: finalY + 4,
      head: [['Competitor', 'Pages Appeared', 'Avg Score']],
      body: competitorData.map(c => [c.name, String(c.count), String(c.avgScore)]),
      styles: { fontSize: 8, cellPadding: 3, textColor: [203, 213, 225], fillColor: [15, 23, 42], lineColor: [51, 65, 85], lineWidth: 0.1 },
      headStyles: { fillColor: [30, 41, 59], textColor: [148, 163, 184], fontStyle: 'bold', fontSize: 7 },
    })
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text(`BrandGEO â AI Visibility Intelligence Â· Page ${i} of ${pageCount}`, W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
  }
  doc.save(`brandgeo-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}
