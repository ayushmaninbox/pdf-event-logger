import express from 'express';
import { router as uploadRouter } from './routes/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

await fs.ensureDir(uploadsDir);
await fs.ensureDir(outputDir);

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', uploadRouter);

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