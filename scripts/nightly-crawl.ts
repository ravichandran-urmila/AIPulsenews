import { generateBrief } from '../services/geminiService';
import * as fs from 'fs';
import * as path from 'path';

// Map the GitHub Secret GEMINI_API_KEY to the expected API_KEY env var
// This allows the shared service code to work without modification.
if (process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  process.env.API_KEY = process.env.GEMINI_API_KEY;
}

const run = async () => {
  // 1. Generate the date string in the same format as the frontend
  // This ensures consistency when/if the frontend reads this static file.
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const dateStr = today.toLocaleDateString('en-US', options);

  console.log(`[Nightly Crawl] Starting generation for: ${dateStr}`);

  try {
    // 2. Run the Gemini generation with search enabled (useSearch = true)
    // The empty string is for inputText, which is ignored when search is enabled.
    const briefData = await generateBrief("", true, dateStr);
    
    // 3. Prepare output directory (public/data)
    // This allows the generated JSON to be served statically by the web host.
    const outputDir = path.join((process as any).cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 4. Write to JSON file
    const outputPath = path.join(outputDir, 'brief.json');
    fs.writeFileSync(outputPath, JSON.stringify(briefData, null, 2));

    console.log(`[Nightly Crawl] Success! Saved brief to ${outputPath}`);
    
  } catch (error) {
    console.error("[Nightly Crawl] Failed:", error);
    (process as any).exit(1);
  }
};

run();