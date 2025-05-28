import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory setup
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
const imagesDir = path.join(__dirname, 'images');

await fs.ensureDir(uploadsDir);
await fs.ensureDir(outputDir);

// Real-world event log examples with more activities
const events = [
  "Document created by Sarah Chen (sarah.chen@cloudbyz.com)",
  "Document emailed to David Miller (david.m@cloudbyz.com) for signature",
  "Document viewed by David Miller (david.m@cloudbyz.com)",
  "David Miller (david.m@cloudbyz.com) entered valid password",
  "Document e-signed by David Miller (david.m@cloudbyz.com)",
  "Signed document emailed to Sarah Chen (sarah.chen@cloudbyz.com)",
  "Document viewed by Sarah Chen (sarah.chen@cloudbyz.com)",
  "Sarah Chen (sarah.chen@cloudbyz.com) approved the document",
  "Document routed to Legal Department for review",
  "Document viewed by John Smith (john.s@cloudbyz.com) from Legal",
  "Legal review completed by John Smith (john.s@cloudbyz.com)",
  "Document sent to Finance Department for processing",
  "Document viewed by Emily Wong (emily.w@cloudbyz.com) from Finance",
  "Payment terms verified by Finance Department",
  "Document archived in compliance repository"
];

function getEvents() {
  return events;
}

function addEvent(event) {
  events.push(event);
  return events;
}

function clearEvents() {
  events.length = 0;
  return events;
}

// Time zone utility function to get IST timestamp
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

// Extracts the original file name from the given file name
function getOriginalFileName(fileName) {
  const match = fileName.match(/\d+-\d+-(.*)/);
  return match ? match[1] : fileName;
}

// PDF Styling functions
async function drawSectionTitle(page, text, fileName, y, font) {
  const originalFileName = getOriginalFileName(fileName);
  const auditText = `Audit Trail - ${originalFileName}`;
  
  // Draw blue border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: page.getSize().width - 40,
    height: page.getSize().height - 40,
    borderColor: rgb(0.0, 0.47, 0.85),
    borderWidth: 2,
  });

  // Calculate text width and wrap if needed
  const fontSize = 24;
  const maxWidth = page.getSize().width - 80;
  const words = auditText.split(' ');
  let line = '';
  let yOffset = y - 10;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    // If the text exceeds the max width, draw the current line and start a new one
    if (textWidth > maxWidth && line) {
      page.drawText(line, {
        x: 40,
        y: yOffset,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      line = word;
      yOffset -= fontSize + 5;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, {
      x: 40,
      y: yOffset,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  page.drawLine({
    start: { x: 40, y: yOffset - 20 },
    end: { x: page.getSize().width - 40, y: yOffset - 20 },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  return yOffset - 40;
}

// Draws the details section with file name, status, and timestamp
async function drawDetailsSection(page, pdfDoc, fileName, y) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const originalFileName = getOriginalFileName(fileName);
  
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
  
  page.drawText(originalFileName, {
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
    color: rgb(0.0, 0.47, 0.85),  // Updated to match Cloudbyz blue
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

// Maps event text to corresponding icon paths
function getEventIcon(eventText) {
  if (eventText.includes('created')) return path.join(imagesDir, 'created.png');
  if (eventText.includes('emailed')) return path.join(imagesDir, 'emailed.png');
  if (eventText.includes('viewed')) return path.join(imagesDir, 'viewed.png');
  if (eventText.includes('password')) return path.join(imagesDir, 'password.png');
  if (eventText.includes('signed')) return path.join(imagesDir, 'signed.png');
  if (eventText.includes('approved')) return path.join(imagesDir, 'approved.png');
  if (eventText.includes('review')) return path.join(imagesDir, 'review.png');
  if (eventText.includes('verified')) return path.join(imagesDir, 'verified.png');
  if (eventText.includes('archived')) return path.join(imagesDir, 'archived.png');
  if (eventText.includes('processing')) return path.join(imagesDir, 'processing.png');
  return null;
}

// Draws the activity section with events
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

  // Icon styling
  const maxIconDimension = 16;
  const iconColor = rgb(0.0, 0.47, 0.85); // Cloudbyz blue color

  for (const [index, event] of eventsOnPage.entries()) {
    const eventY = startY - (index * lineHeight);
    const iconPath = getEventIcon(event.toLowerCase());
    
    if (iconPath) {
      try {
        const imageBytes = await fs.readFile(iconPath);
        const image = await pdfDoc.embedPng(imageBytes);
        const imageDims = image.scale(1);
        
        let width = imageDims.width;
        let height = imageDims.height;

        if (width > height) {
          const scale = maxIconDimension / width;
          width = maxIconDimension;
          height = height * scale;
        } else {
          const scale = maxIconDimension / height;
          height = maxIconDimension;
          width = width * scale;
        }

        const verticalOffset = (maxIconDimension - height) / 2;
        
        // Draw a colored circle as background for the icon
        page.drawCircle({
          x: 60 + (width / 2),
          y: eventY + verticalOffset + (height / 2),
          size: Math.max(width, height) / 2,
          color: iconColor,
        });
        
        page.drawImage(image, {
          x: 60,
          y: eventY + verticalOffset,
          width,
          height,
          color: rgb(1, 1, 1), // White color for the icon
        });
      } catch (error) {
        console.error(`Error embedding icon for event: ${event}`, error);
      }
    }
    
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
  }
}

// Draws the footer with the Cloudbyz logo
async function drawFooter(page, pdfDoc) {
  try {
    const logoPath = path.join(__dirname, 'cloudbyz.png');
    const logoImage = await fs.readFile(logoPath);
    const logo = await pdfDoc.embedPng(logoImage);
    
    const logoWidth = 100;
    const logoHeight = 30;
    
    page.drawImage(logo, {
      x: 40,
      y: 30,
      width: logoWidth,
      height: logoHeight
    });
  } catch (error) {
    console.error('Error drawing footer:', error);
  }
}

// APPROACH 1: Append events to an existing PDF
async function appendEventPage(pdfPath, events) {
  try {
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes); 
    const fileName = path.basename(pdfPath);
    const originalFileName = getOriginalFileName(fileName);
    
    const page1 = pdfDoc.addPage(); 
    const { height } = page1.getSize();
    
    const titleY = await drawSectionTitle(page1, 'Audit Trail', fileName, height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page1, pdfDoc, fileName, titleY);
    await drawActivitySection(page1, pdfDoc, events, 0, 6, activityY, true);
    await drawFooter(page1, pdfDoc);
    
    const page2 = pdfDoc.addPage();
    await drawSectionTitle(page2, 'Audit Trail', fileName, height - 50, await pdfDoc.embedFont(StandardFonts.HelveticaBold));
    await drawActivitySection(page2, pdfDoc, events, 6, events.length, height - 150);
    await drawFooter(page2, pdfDoc);
    
    const modifiedPdfBytes = await pdfDoc.save();
    const outputPath = path.join(outputDir, `${originalFileName.replace('.pdf', '')}_logged.pdf`);
    await fs.writeFile(outputPath, modifiedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error in appendEventPage:', error);
    throw error;
  }
}

// APPROACH 2: Create a new PDF with events and merge with the original PDF
async function createAndMergePdf(pdfPath, events) {
  try {
    const fileName = path.basename(pdfPath);
    const originalFileName = getOriginalFileName(fileName);
    const eventsPdfDoc = await PDFDocument.create();
    
    const page1 = eventsPdfDoc.addPage();
    const { height } = page1.getSize();
    
    const titleY = await drawSectionTitle(page1, 'Audit Trail', fileName, height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
    const activityY = await drawDetailsSection(page1, eventsPdfDoc, fileName, titleY);
    await drawActivitySection(page1, eventsPdfDoc, events, 0, 6, activityY, true);
    await drawFooter(page1, eventsPdfDoc);
    
    const page2 = eventsPdfDoc.addPage();
    await drawSectionTitle(page2, 'Audit Trail', fileName, height - 50, await eventsPdfDoc.embedFont(StandardFonts.HelveticaBold));
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
    const outputPath = path.join(outputDir, `${originalFileName.replace('.pdf', '')}_logged.pdf`);
    await fs.writeFile(outputPath, mergedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error in createAndMergePdf:', error);
    throw error;
  }
}

// Ensure the uploads directory exists
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Filter to allow only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// Express App Setup
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST route to handle PDF uploads
app.post('/api/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded or file is not a PDF');
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const approach = req.body.approach || 'append';
    
    let outputPath;
    
    if (approach === 'append') {
      outputPath = await appendEventPage(filePath, getEvents());
    } else {
      outputPath = await createAndMergePdf(filePath, getEvents());
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="modified-${fileName}"`);
    
    res.download(outputPath, `modified-${fileName}`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).send(`Error processing PDF: ${error.message}`);
  }
});

// HOME PAGE FORM
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>PDF Event Logger</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #333;
          }
          form {
            margin-top: 20px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          label {
            display: block;
            margin-bottom: 10px;
          }
          button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
          .approach-selector {
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <h1>PDF Event Logger</h1>
        <p>Upload a PDF to add event logs to it.</p>
        
        <form action="/api/upload" method="post" enctype="multipart/form-data">
          <div class="approach-selector">
            <label>
              <input type="radio" name="approach" value="append" checked> 
              Approach 1: Append page to existing PDF
            </label>
            <label>
              <input type="radio" name="approach" value="merge"> 
              Approach 2: Create and merge PDFs
            </label>
          </div>
          
          <label for="pdfFile">Select PDF file:</label>
          <input type="file" id="pdfFile" name="pdfFile" accept="application/pdf" required>
          
          <button type="submit">Upload and Process</button>
        </form>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});