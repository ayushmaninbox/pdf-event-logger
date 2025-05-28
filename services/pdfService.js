import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '../output');

// Helper function to get IST timestamp
function getISTTimestamp() {
  const date = new Date();
  return date.toLocaleString('en-US', { 
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' IST';
}

// Helper function to draw section title
async function drawSectionTitle(page, text, approach, y, font) {
  const auditText = `Audit Trail ${approach === 'append' ? '(Append Page)' : '(Merge PDF)'}`;
  
  // Draw background rectangle
  page.drawRectangle({
    x: 40,
    y: y - 40,
    width: page.getSize().width - 80,
    height: 50,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });

  // Draw title
  page.drawText(auditText, {
    x: 50,
    y: y - 10,
    size: 28,
    font,
    color: rgb(0.2, 0.2, 0.8),
  });
}

// Helper function to draw details section
async function drawDetailsSection(page, pdfDoc, fileName, y) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Draw section background
  page.drawRectangle({
    x: 40,
    y: y - 150,
    width: page.getSize().width - 80,
    height: 130,
    color: rgb(0.98, 0.98, 1),
    borderColor: rgb(0.8, 0.8, 0.9),
    borderWidth: 1,
  });
  
  // Draw Details section
  page.drawText('Document Details', {
    x: 50,
    y: y - 35,
    size: 20,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.8),
  });
  
  // Labels and values
  const labelX = 60;
  const valueX = 250;
  const startY = y - 70;
  const lineHeight = 30;
  
  // File name
  page.drawText('DOCUMENT NAME', {
    x: labelX,
    y: startY,
    size: 12,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(fileName, {
    x: valueX,
    y: startY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Status
  page.drawText('DOCUMENT STATUS', {
    x: labelX,
    y: startY - lineHeight,
    size: 12,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Draw status indicator
  page.drawRectangle({
    x: valueX,
    y: startY - lineHeight - 5,
    width: 80,
    height: 22,
    color: rgb(0.9, 0.97, 0.9),
    borderColor: rgb(0.2, 0.8, 0.2),
    borderWidth: 1,
    borderRadius: 4,
  });
  
  page.drawText('VERIFIED', {
    x: valueX + 15,
    y: startY - lineHeight + 3,
    size: 12,
    font: boldFont,
    color: rgb(0.2, 0.8, 0.2),
  });
  
  // Timestamp
  const timestamp = getISTTimestamp();
  page.drawText('VERIFICATION TIME', {
    x: labelX,
    y: startY - (lineHeight * 2),
    size: 12,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(timestamp, {
    x: valueX,
    y: startY - (lineHeight * 2),
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  return startY - (lineHeight * 3);
}

// Helper function to draw activity section
async function drawActivitySection(page, pdfDoc, events, y) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Draw section background
  page.drawRectangle({
    x: 40,
    y: y - (events.length * 40) - 60,
    width: page.getSize().width - 80,
    height: events.length * 40 + 50,
    color: rgb(0.98, 0.98, 1),
    borderColor: rgb(0.8, 0.8, 0.9),
    borderWidth: 1,
  });
  
  // Draw Activity section title
  page.drawText('Activity Timeline', {
    x: 50,
    y: y - 35,
    size: 20,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.8),
  });
  
  const startY = y - 70;
  const lineHeight = 35;
  
  events.forEach((event, index) => {
    const eventY = startY - (index * lineHeight);
    
    // Draw event indicator
    page.drawCircle({
      x: 65,
      y: eventY + 6,
      size: 4,
      color: rgb(0.3, 0.3, 0.8),
    });
    
    // Draw event text
    page.drawText(event, {
      x: 80,
      y: eventY,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Draw timestamp
    const timestamp = getISTTimestamp();
    page.drawText(timestamp, {
      x: page.getSize().width - 200,
      y: eventY,
      size: 11,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });
}

// Approach 1: Append a new page to the existing PDF with events
export async function appendEventPage(pdfPath, events) {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.addPage();
    const { height } = page.getSize();
    
    // Draw title section
    await drawSectionTitle(page, 'Audit Trail', 'append', height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    
    // Draw Details section
    const activityY = await drawDetailsSection(page, pdfDoc, path.basename(pdfPath), height - 150);
    
    // Draw Activity section
    await drawActivitySection(page, pdfDoc, events, activityY);
    
    const modifiedPdfBytes = await pdfDoc.save();
    const outputPath = path.join(outputDir, `modified-${path.basename(pdfPath)}`);
    await fs.writeFile(outputPath, modifiedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error in appendEventPage:', error);
    throw error;
  }
}

// Approach 2: Create a new PDF with events and merge with the original
export async function createAndMergePdf(pdfPath, events) {
  try {
    const eventsPdfDoc = await PDFDocument.create();
    const page = eventsPdfDoc.addPage();
    const { height } = page.getSize();
    
    // Draw title section
    await drawSectionTitle(page, 'Audit Trail', 'merge', height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
    
    // Draw Details section
    const activityY = await drawDetailsSection(page, eventsPdfDoc, path.basename(pdfPath), height - 150);
    
    // Draw Activity section
    await drawActivitySection(page, eventsPdfDoc, events, activityY);
    
    const eventsPdfBytes = await eventsPdfDoc.save();
    
    // Merge with original PDF
    const originalPdfBytes = await fs.readFile(pdfPath);
    const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
    const mergedPdfDoc = await PDFDocument.create();
    
    const originalPages = await mergedPdfDoc.copyPages(originalPdfDoc, originalPdfDoc.getPageIndices());
    originalPages.forEach((page) => mergedPdfDoc.addPage(page));
    
    const eventsPdfDoc2 = await PDFDocument.load(eventsPdfBytes);
    const eventsPage = await mergedPdfDoc.copyPages(eventsPdfDoc2, [0]);
    mergedPdfDoc.addPage(eventsPage[0]);
    
    const mergedPdfBytes = await mergedPdfDoc.save();
    const outputPath = path.join(outputDir, `merged-${path.basename(pdfPath)}`);
    await fs.writeFile(outputPath, mergedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error in createAndMergePdf:', error);
    throw error;
  }
}