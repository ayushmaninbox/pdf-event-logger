import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function cleanupFile(filePath) {
  try {
    if (await fs.pathExists(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
}

export async function ensureDirectories() {
  const uploadsDir = path.join(__dirname, '../uploads');
  const outputDir = path.join(__dirname, '../output');
  
  await fs.ensureDir(uploadsDir);
  await fs.ensureDir(outputDir);
}

export async function getFilesInDirectory(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.map(file => path.join(dir, file));
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}