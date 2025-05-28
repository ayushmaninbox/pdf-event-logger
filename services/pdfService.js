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
  
  // Draw title
  page.drawText(auditText, {
    x: 40,
    y: y - 10,
    size: 24,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Draw separator line
  page.drawLine({
    start: { x: 40, y: y - 30 },
    end: { x: page.getSize().width - 40, y: y - 30 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
}

async function drawDetailsSection(page, pdfDoc, fileName, y) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Draw section title
  page.drawText('Details', {
    x: 40,
    y: y - 35,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Draw content box with light border
  page.drawRectangle({
    x: 40,
    y: y - 140,
    width: page.getSize().width - 80,
    height: 90,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });

  const labelX = 60;
  const valueX = 200;
  const startY = y - 70;
  const lineHeight = 30;
  
  // File name
  page.drawText('FILE NAME', {
    x: labelX,
    y: startY,
    size: 10,
    font: boldFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText(fileName, {
    x: valueX,
    y: startY,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Status
  page.drawText('STATUS', {
    x: labelX,
    y: startY - lineHeight,
    size: 10,
    font: boldFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Draw status with dot
  page.drawCircle({
    x: valueX,
    y: startY - lineHeight + 4,
    size: 3,
    color: rgb(0.2, 0.7, 0.2),
  });
  
  page.drawText('Signed', {
    x: valueX + 10,
    y: startY - lineHeight,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Timestamp
  const timestamp = getISTTimestamp();
  page.drawText('STATUS TIMESTAMP', {
    x: labelX,
    y: startY - (lineHeight * 2),
    size: 10,
    font: boldFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText(timestamp, {
    x: valueX,
    y: startY - (lineHeight * 2),
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  return startY - (lineHeight * 3) - 40;
}

async function drawActivitySection(page, pdfDoc, events, startIndex, endIndex, y, isFirstPage = false) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  if (!isFirstPage) {
    // Draw section title for continuation pages
    page.drawText('Activity (Continued)', {
      x: 40,
      y: y - 35,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  } else {
    // Draw section title for first page
    page.drawText('Activity', {
      x: 40,
      y: y - 35,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  }
  
  const startY = y - 80;
  const lineHeight = 50;
  const eventsOnPage = events.slice(startIndex, endIndex);
  
  // Draw content box with light border
  page.drawRectangle({
    x: 40,
    y: startY - (eventsOnPage.length * lineHeight) + 20,
    width: page.getSize().width - 80,
    height: eventsOnPage.length * lineHeight,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });

  eventsOnPage.forEach((event, index) => {
    const eventY = startY - (index * lineHeight);
    
    // Draw separator line between events
    if (index > 0) {
      page.drawLine({
        start: { x: 40, y: eventY + 35 },
        end: { x: page.getSize().width - 40, y: eventY + 35 },
        thickness: 1,
        color: rgb(0.9, 0.9, 0.9),
      });
    }
    
    // Draw event text
    page.drawText(event, {
      x: 60,
      y: eventY,
      size: 11,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Draw timestamp
    const timestamp = getISTTimestamp();
    page.drawText(timestamp, {
      x: 60,
      y: eventY - 20,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });
}

async function drawFooter(page, pdfDoc) {
  const { width, height } = page.getSize();
  
  // Load and embed the logo image
  const logoBytes = await fs.readFile(path.join(__dirname, '../cloudbyz.svg'));
  const logoImage = await pdfDoc.embedSvg(logoBytes);
  const scaleFactor = 0.15;
  
  const logoWidth = logoImage.width * scaleFactor;
  const logoHeight = logoImage.height * scaleFactor;
  
  // Draw the logo at the bottom center
  page.drawSvg(logoBytes, {
    x: (width - logoWidth) / 2,
    y: 20,
    width: logoWidth,
    height: logoHeight,
  });
}

export async function appendEventPage(pdfPath, events) {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // First additional page with details and first set of events
    const page1 = pdfDoc.addPage();
    const { height } = page1.getSize();
    
    await drawSectionTitle(page1, 'Audit Trail', 'append', height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page1, pdfDoc, path.basename(pdfPath), height - 150);
    await drawActivitySection(page1, pdfDoc, events, 0, 8, activityY, true);
    await drawFooter(page1, pdfDoc);
    
    // Second additional page with remaining events
    const page2 = pdfDoc.addPage();
    await drawSectionTitle(page2, 'Audit Trail', 'append', height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    await drawActivitySection(page2, pdfDoc, events, 8, events.length, height - 150);
    await drawFooter(page2, pdfDoc);
    
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
    
    // First page with details and first set of events
    const page1 = eventsPdfDoc.addPage();
    const { height } = page1.getSize();
    
    await drawSectionTitle(page1, 'Audit Trail', 'merge', height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page1, eventsPdfDoc, path.basename(pdfPath), height - 150);
    await drawActivitySection(page1, eventsPdfDoc, events, 0, 8, activityY, true);
    await drawFooter(page1, eventsPdfDoc);
    
    // Second page with remaining events
    const page2 = eventsPdfDoc.addPage();
    await drawSectionTitle(page2, 'Audit Trail', 'merge', height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
    await drawActivitySection(page2, eventsPdfDoc, events, 8, events.length, height - 150);
    await drawFooter(page2, eventsPdfDoc);
    
    const eventsPdfBytes = await eventsPdfDoc.save();
    
    const originalPdfBytes = await fs.readFile(pdfPath);
    const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
    const mergedPdfDoc = await PDFDocument.create();
    
    const originalPages = await mergedPdfDoc.copyPages(originalPdfDoc, originalPdfDoc.getPageIndices());
    originalPages.forEach((page) => mergedPdfDoc.addPage(page));
    
    const eventsPdfDoc2 = await PDFDocument.load(eventsPdfBytes);
    const eventsPages = await mergedPdfDoc.copyPages(eventsPdfDoc2, [0, 1]);
    eventsPages.forEach((page) => mergedPdfDoc.addPage(page));
    
    const mergedPdfBytes = await mergedPdfDoc.save();
    const outputPath = path.join(outputDir, `merged-${path.basename(pdfPath)}`);
    await fs.writeFile(outputPath, mergedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error in createAndMergePdf:', error);
    throw error;
  }
}