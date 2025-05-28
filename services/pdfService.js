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
    x: 40,
    y: y - 10,
    size: 24,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

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
  
  page.drawText('Details', {
    x: 40,
    y: y - 35,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
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
  
  page.drawText('STATUS', {
    x: labelX,
    y: startY - lineHeight,
    size: 10,
    font: boldFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
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

function getEventIcon(eventText) {
  if (eventText.includes('created')) return '📄';
  if (eventText.includes('emailed')) return '📧';
  if (eventText.includes('viewed')) return '👁️';
  if (eventText.includes('password')) return '🔑';
  if (eventText.includes('signed')) return '✍️';
  if (eventText.includes('approved')) return '✅';
  if (eventText.includes('review')) return '📝';
  if (eventText.includes('verified')) return '✔️';
  if (eventText.includes('archived')) return '📦';
  return '•';
}

async function drawActivitySection(page, pdfDoc, events, startIndex, endIndex, y, isFirstPage = false) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  if (!isFirstPage) {
    page.drawText('Activity (Continued)', {
      x: 40,
      y: y - 35,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  } else {
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
  
  page.drawRectangle({
    x: 40,
    y: startY - (eventsOnPage.length * lineHeight) + 20,
    width: page.getSize().width - 80,
    height: eventsOnPage.length * lineHeight + 20,
    color: rgb(0.98, 0.98, 0.98),
  });

  eventsOnPage.forEach((event, index) => {
    const eventY = startY - (index * lineHeight);
    const icon = getEventIcon(event.toLowerCase());
    
    page.drawText(icon, {
      x: 60,
      y: eventY + 10,
      size: 12,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    page.drawText(event, {
      x: 85,
      y: eventY + 10,
      size: 11,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    const timestamp = getISTTimestamp();
    page.drawText(timestamp, {
      x: 85,
      y: eventY - 10,
      size: 10,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });
}

async function drawFooter(page, pdfDoc) {
  try {
    const logoPath = path.join(__dirname, '../cloudbyz.png');
    const logoImage = await fs.readFile(logoPath);
    const logo = await pdfDoc.embedPng(logoImage);
    const { width: pageWidth } = page.getSize();
    
    const logoWidth = 100;
    const logoHeight = 30;
    const logoX = (pageWidth - logoWidth) / 2;
    
    page.drawImage(logo, {
      x: logoX,
      y: 20,
      width: logoWidth,
      height: logoHeight
    });
  } catch (error) {
    console.error('Error drawing footer:', error);
  }
}

export async function appendEventPage(pdfPath, events) {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const page1 = pdfDoc.addPage();
    const { height } = page1.getSize();
    
    await drawSectionTitle(page1, 'Audit Trail', 'append', height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page1, pdfDoc, path.basename(pdfPath), height - 150);
    await drawActivitySection(page1, pdfDoc, events, 0, 6, activityY, true);
    await drawFooter(page1, pdfDoc);
    
    const page2 = pdfDoc.addPage();
    await drawSectionTitle(page2, 'Audit Trail', 'append', height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    await drawActivitySection(page2, pdfDoc, events, 6, events.length, height - 150);
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
    
    const page1 = eventsPdfDoc.addPage();
    const { height } = page1.getSize();
    
    await drawSectionTitle(page1, 'Audit Trail', 'merge', height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page1, eventsPdfDoc, path.basename(pdfPath), height - 150);
    await drawActivitySection(page1, eventsPdfDoc, events, 0, 6, activityY, true);
    await drawFooter(page1, eventsPdfDoc);
    
    const page2 = eventsPdfDoc.addPage();
    await drawSectionTitle(page2, 'Audit Trail', 'merge', height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
    await drawActivitySection(page2, eventsPdfDoc, events, 6, events.length, height - 150);
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