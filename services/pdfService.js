import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '../output');

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

async function drawSectionTitle(page, text, approach, y, font) {
  const auditText = `Audit Trail ${approach === 'append' ? '(Append Page)' : '(Merge PDF)'}`;
  
  page.drawText(auditText, {
    x: 50,
    y: y - 10,
    size: 24,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawLine({
    start: { x: 50, y: y - 20 },
    end: { x: page.getSize().width - 50, y: y - 20 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
}

async function drawDetailsSection(page, pdfDoc, fileName, y) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  page.drawText('Document Details', {
    x: 50,
    y: y - 35,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  const labelX = 50;
  const valueX = 200;
  const startY = y - 70;
  const lineHeight = 25;
  
  page.drawText('Document Name:', {
    x: labelX,
    y: startY,
    size: 11,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(fileName, {
    x: valueX,
    y: startY,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page.drawText('Status:', {
    x: labelX,
    y: startY - lineHeight,
    size: 11,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText('Verified', {
    x: valueX,
    y: startY - lineHeight,
    size: 11,
    font: font,
    color: rgb(0.2, 0.6, 0.2),
  });
  
  const timestamp = getISTTimestamp();
  page.drawText('Verification Time:', {
    x: labelX,
    y: startY - (lineHeight * 2),
    size: 11,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(timestamp, {
    x: valueX,
    y: startY - (lineHeight * 2),
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  return startY - (lineHeight * 3) - 20;
}

async function drawActivitySection(page, pdfDoc, events, y) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  page.drawText('Activity Timeline', {
    x: 50,
    y: y - 35,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  const startY = y - 70;
  const lineHeight = 30;
  
  events.forEach((event, index) => {
    const eventY = startY - (index * lineHeight);
    
    page.drawText('•', {
      x: 50,
      y: eventY,
      size: 11,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    page.drawText(event, {
      x: 65,
      y: eventY,
      size: 11,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    const timestamp = getISTTimestamp();
    page.drawText(timestamp, {
      x: page.getSize().width - 180,
      y: eventY,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });
}

export async function appendEventPage(pdfPath, events) {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.addPage();
    const { height } = page.getSize();
    
    await drawSectionTitle(page, 'Audit Trail', 'append', height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page, pdfDoc, path.basename(pdfPath), height - 150);
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

export async function createAndMergePdf(pdfPath, events) {
  try {
    const eventsPdfDoc = await PDFDocument.create();
    const page = eventsPdfDoc.addPage();
    const { height } = page.getSize();
    
    await drawSectionTitle(page, 'Audit Trail', 'merge', height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page, eventsPdfDoc, path.basename(pdfPath), height - 150);
    await drawActivitySection(page, eventsPdfDoc, events, activityY);
    
    const eventsPdfBytes = await eventsPdfDoc.save();
    
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