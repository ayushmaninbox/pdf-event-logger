import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '../output');

// Approach 1: Append a new page to the existing PDF with events

export async function appendEventPage(pdfPath, events) {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Event Log - Append', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const lineHeight = 20;
    events.forEach((event, index) => {
      page.drawText(event, {
        x: 50,
        y: height - 100 - (index * lineHeight),
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    });

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
    const { width, height } = page.getSize();
    const font = await eventsPdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Event Log - Create & Merge', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const lineHeight = 20;
    events.forEach((event, index) => {
      page.drawText(event, {
        x: 50,
        y: height - 100 - (index * lineHeight),
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
    });

    const eventsPdfBytes = await eventsPdfDoc.save();

    const originalPdfBytes = await fs.readFile(pdfPath);
    const originalPdfDoc = await PDFDocument.load(originalPdfBytes);

    const mergedPdfDoc = await PDFDocument.create();

    const originalPages = await mergedPdfDoc.copyPages(originalPdfDoc, originalPdfDoc.getPageIndices());
    originalPages.forEach((page) => {
      mergedPdfDoc.addPage(page);
    });

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