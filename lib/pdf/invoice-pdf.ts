// ============================================
// OMNIX LAB - INVOICE PDF GENERATOR
// Works client-side (download) and can be extended server-side
// ============================================

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoicePDFData {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  currency: string
  clientName: string
  clientCompany: string
  clientEmail: string
  clientPhone: string
  projectName: string | null
  items: {
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }[]
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  remainingBalance: number
  status: string
  paymentTerms: string
  notes: string | null
}

export function generateInvoicePDF(data: InvoicePDFData): void {
  const doc = new jsPDF()

  // ============================================
  // HEADER
  // ============================================
  doc.setFillColor(79, 70, 229) // Indigo
  doc.rect(0, 0, 210, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('OMNIX LAB', 14, 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Global Software Development Partner', 14, 22)
  doc.text('helloafrica@omnixlab-production.up.railway.app', 14, 28)

  // Invoice Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 196, 15, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(data.invoiceNumber, 196, 22, { align: 'right' })

  // ============================================
  // BILL TO & INVOICE DETAILS
  // ============================================
  let yPosition = 50

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', 14, yPosition)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(data.clientName, 14, yPosition + 6)
  if (data.clientCompany) {
    doc.text(data.clientCompany, 14, yPosition + 12)
  }
  if (data.clientEmail) {
    doc.text(data.clientEmail, 14, yPosition + 18)
  }
  if (data.clientPhone) {
    doc.text(data.clientPhone, 14, yPosition + 24)
  }

  // Invoice Details on right side
  const rightX = 140
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE DETAILS', rightX, yPosition)

  doc.setFont('helvetica', 'normal')
  doc.text(`Issue Date:`, rightX, yPosition + 6)
  doc.text(data.issueDate, rightX + 30, yPosition + 6)

  doc.text(`Due Date:`, rightX, yPosition + 12)
  doc.text(data.dueDate, rightX + 30, yPosition + 12)

  doc.text(`Currency:`, rightX, yPosition + 18)
  doc.text(data.currency, rightX + 30, yPosition + 18)

  if (data.projectName) {
    doc.text(`Project:`, rightX, yPosition + 24)
    doc.text(data.projectName, rightX + 30, yPosition + 24)
  }

  doc.text(`Status:`, rightX, yPosition + 30)
  doc.text(data.status.toUpperCase(), rightX + 30, yPosition + 30)

  // ============================================
  // LINE ITEMS TABLE
  // ============================================
  yPosition += 40

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Amount']],
    body: data.items.map((item, index) => [
      String(index + 1),
      item.description,
      String(item.quantity),
      formatCurrency(item.unitPrice, data.currency),
      formatCurrency(item.amount, data.currency),
    ]),
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
  })

  // ============================================
  // TOTALS
  // ============================================
  let tableEndY = (doc as any).lastAutoTable.finalY + 10

  const totalsX = 120

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal:', totalsX, tableEndY)
  doc.text(formatCurrency(data.subtotal, data.currency), 190, tableEndY, { align: 'right' })

  if (data.discount > 0) {
    tableEndY += 6
    doc.text('Discount:', totalsX, tableEndY)
    doc.text(`-${formatCurrency(data.discount, data.currency)}`, 190, tableEndY, { align: 'right' })
  }

  if (data.tax > 0) {
    tableEndY += 6
    doc.text('Tax:', totalsX, tableEndY)
    doc.text(formatCurrency(data.tax, data.currency), 190, tableEndY, { align: 'right' })
  }

  tableEndY += 8
  doc.setDrawColor(200, 200, 200)
  doc.line(totalsX, tableEndY - 4, 190, tableEndY - 4)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totalsX, tableEndY)
  doc.text(formatCurrency(data.total, data.currency), 190, tableEndY, { align: 'right' })

  if (data.amountPaid > 0) {
    tableEndY += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Paid:', totalsX, tableEndY)
    doc.text(formatCurrency(data.amountPaid, data.currency), 190, tableEndY, { align: 'right' })

    tableEndY += 6
    doc.text('Remaining Balance:', totalsX, tableEndY)
    doc.text(formatCurrency(data.remainingBalance, data.currency), 190, tableEndY, { align: 'right' })
  }

  // ============================================
  // NOTES
  // ============================================
  if (data.notes) {
    tableEndY += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTES', 14, tableEndY)

    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(data.notes, 180)
    doc.text(noteLines, 14, tableEndY + 6)
  }

  // ============================================
  // FOOTER
  // ============================================
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('Thank you for choosing Omnix Lab as your software development partner.', 105, 285, { align: 'center' })
  doc.text('Omnix Lab • Global Software Development • helloafrica@omnixlab-production.up.railway.app', 105, 290, { align: 'center' })

  // Save PDF
  doc.save(`${data.invoiceNumber}.pdf`)
}

export function generateReceiptPDF(data: {
  receiptNumber: string
  invoiceNumber: string
  clientName: string
  amount: number
  currency: string
  paymentMethod: string
  paymentDate: string
  providerReference: string | null
}): void {
  const doc = new jsPDF()

  // Header
  doc.setFillColor(16, 185, 129) // Green
  doc.rect(0, 0, 210, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('OMNIX LAB', 14, 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Payment Receipt', 196, 15, { align: 'right' })
  doc.text(data.receiptNumber, 196, 22, { align: 'right' })

  let yPosition = 50

  doc.setTextColor(60, 60, 60)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT CONFIRMED', 105, yPosition, { align: 'center' })

  yPosition += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  doc.text('Received From:', 14, yPosition)
  doc.text(data.clientName, 60, yPosition)

  yPosition += 8
  doc.text('Invoice Number:', 14, yPosition)
  doc.text(data.invoiceNumber, 60, yPosition)

  yPosition += 8
  doc.text('Amount Paid:', 14, yPosition)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(data.amount, data.currency), 60, yPosition)
  doc.setFont('helvetica', 'normal')

  yPosition += 8
  doc.text('Payment Method:', 14, yPosition)
  doc.text(data.paymentMethod, 60, yPosition)

  yPosition += 8
  doc.text('Payment Date:', 14, yPosition)
  doc.text(data.paymentDate, 60, yPosition)

  if (data.providerReference) {
    yPosition += 8
    doc.text('Transaction Reference:', 14, yPosition)
    doc.text(data.providerReference, 60, yPosition)
  }

  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('This receipt confirms payment for services provided by Omnix Lab.', 105, 285, { align: 'center' })

  doc.save(`${data.receiptNumber}.pdf`)
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0)
  } catch {
    return `${currency} ${(amount || 0).toLocaleString()}`
  }
}
