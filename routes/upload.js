import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { appendEventPage, createAndMergePdf } from '../services/pdfService.js';
import { getEvents } from '../services/eventService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

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
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const router = express.Router();

router.post('/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded or file is not a PDF');
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    const approach = req.body.approach || 'append';

    const events = getEvents();
    
    let outputPath;
    
    if (approach === 'append') {
      // Approach 1: Append a page to the existing PDF
      outputPath = await appendEventPage(filePath, events);
    } else {
      // Approach 2: Create a new PDF with events and merge it
      outputPath = await createAndMergePdf(filePath, events);
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

export { router };