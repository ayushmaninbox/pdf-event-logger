import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '../output');

// Helper function to draw section title
async function drawSectionTitle(page, text, y, font) {
  page.drawText(text, {
    x: 50,
    y,
    size: 24,
    font,
    color: rgb(0, 0, 0),
  });
}

// Helper function to draw details section
async function drawDetailsSection(page, pdfDoc, fileName, y) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Draw Details section
  drawSectionTitle(page, 'Details', y, boldFont);
  
  // Labels and values
  const labelX = 50;
  const valueX = 250;
  const startY = y - 50;
  const lineHeight = 30;
  
  // File name
  page.drawText('FILE NAME', {
    x: labelX,
    y: startY,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText(fileName, {
    x: valueX,
    y: startY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Status
  page.drawText('STATUS', {
    x: labelX,
    y: startY - lineHeight,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Draw green circle
  page.drawCircle({
    x: valueX,
    y: startY - lineHeight + 6,
    size: 6,
    color: rgb(0.2, 0.8, 0.2),
  });
  
  page.drawText('Processed', {
    x: valueX + 15,
    y: startY - lineHeight,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Timestamp
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';
  page.drawText('STATUS TIMESTAMP', {
    x: labelX,
    y: startY - (lineHeight * 2),
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
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
  
  // Draw Activity section
  drawSectionTitle(page, 'Activity', y, boldFont);
  
  const startY = y - 50;
  const lineHeight = 30;
  
  events.forEach((event, index) => {
    const eventY = startY - (index * lineHeight);
    
    // Draw event text
    page.drawText(event, {
      x: 50,
      y: eventY,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Draw timestamp
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';
    page.drawText(timestamp, {
      x: page.getSize().width - 200,
      y: eventY,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
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
    
    // Draw Details section
    const activityY = await drawDetailsSection(page, pdfDoc, path.basename(pdfPath), height - 50);
    
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
    
    // Draw Details section
    const activityY = await drawDetailsSection(page, eventsPdfDoc, path.basename(pdfPath), height - 50);
    
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