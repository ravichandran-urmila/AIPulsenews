import { generateBrief } from '../services/geminiService';
import * as fs from 'fs';
import * as path from 'path';

if (process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

const run = async () => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateStr = today.toLocaleDateString('en-US', options);
  const fileDateStamp = today.toISOString().split('T')[0];

  console.log(`[Nightly Crawl] Starting generation for: ${dateStr}`);

  try {
    const briefData = await generateBrief("", true, dateStr);
    
    const outputDir = path.join((process as any).cwd(), 'public', 'data');
    const archivesDir = path.join(outputDir, 'archives');
    const outputPath = path.join(outputDir, 'brief.json');
    const manifestPath = path.join(outputDir, 'manifest.json');

    if (!fs.existsSync(archivesDir)) {
      fs.mkdirSync(archivesDir, { recursive: true });
    }

    // 1. Archive previous today's brief if it exists
    if (fs.existsSync(outputPath)) {
      try {
        const stats = fs.statSync(outputPath);
        const mtime = new Date(stats.mtime);
        const prevDateStamp = mtime.toISOString().split('T')[0];
        const archivePath = path.join(archivesDir, `brief-${prevDateStamp}.json`);
        
        fs.copyFileSync(outputPath, archivePath);
        console.log(`[Nightly Crawl] Archived previous brief to: ${archivePath}`);
      } catch (archiveError) {
        console.error("[Nightly Crawl] Warning: Archive error:", archiveError);
      }
    }

    // 2. Write new today's brief
    fs.writeFileSync(outputPath, JSON.stringify(briefData, null, 2));

    // 3. Update Manifest
    let manifest: string[] = [];
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (e) { manifest = []; }
    }
    
    // Add both the pretty date string and the raw datestamp for easier lookup
    // Using the pretty date as the primary key to match frontend state
    if (!manifest.includes(dateStr)) {
      manifest.push(dateStr);
      // Keep unique and sorted (newest first happens in frontend, but we can store chronologically)
      manifest = Array.from(new Set(manifest));
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`[Nightly Crawl] Success! Updated brief and manifest.`);
    
  } catch (error) {
    console.error("[Nightly Crawl] Failed:", error);
    (process as any).exit(1);
  }
};

run();