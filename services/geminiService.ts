import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BriefData } from "../types";

// Define the response schema to ensure Gemini returns structured data suitable for our UI
const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    cluster: {
      type: Type.STRING,
      description: "The primary ecosystem player or topic grouping (e.g., 'Google / DeepMind', 'OpenAI', 'Regulatory', 'Healthcare Systems').",
    },
    headline: {
      type: Type.STRING,
      description: "Newspaper-style headline. Short and punchy.",
    },
    summary: {
      type: Type.STRING,
      description: "Detailed, self-contained summary (3-5 paragraphs). MUST cover key facts, figures, dates, and implications so the user does NOT need to click the source link. Explain 'Why it matters' clearly.",
    },
    source: {
      type: Type.STRING,
      description: "The primary source (e.g., 'OpenAI Blog', 'X (@ylecun)').",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-3 short tags (e.g., 'Policy', 'Clinical', 'Models').",
    },
    url: {
      type: Type.STRING,
      description: "Original URL found via search or input.",
    },
    date: {
      type: Type.STRING,
      description: "The date of the story (e.g., 'Oct 24', 'Today').",
    },
  },
  required: ["headline", "summary", "source", "tags"],
};

const socialPostSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    handle: { type: Type.STRING, description: "The X handle (e.g. @ylecun)." },
    authorName: { type: Type.STRING, description: "Full name if available." },
    content: { type: Type.STRING, description: "The content of the post or summary of the thread." },
    url: { type: Type.STRING, description: "Direct link to the tweet/post." },
    date: { type: Type.STRING, description: "Relative date (e.g. '2h ago', 'Today')." },
    type: { type: Type.STRING, enum: ["Announcement", "Opinion", "Research"], description: "Category of the post." }
  },
  required: ["handle", "content"]
};

const pocStepSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    stepTitle: { type: Type.STRING, description: "Short title for this step (e.g. 'Set up API Key')." },
    instruction: { type: Type.STRING, description: "Clear, instructional text on what to do." },
    codeSnippet: { type: Type.STRING, description: "Optional code snippet, terminal command, or configuration JSON." }
  },
  required: ["stepTitle", "instruction"]
};

const pocItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING, description: "1-2 sentences on what you will build." },
    tools: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "List of Google tools or frameworks used (e.g. 'Vertex AI', 'Gemini 1.5')." 
    },
    skills: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Key concepts learned (e.g. 'RAG', 'Prompt Design')." 
    },
    complexity: { 
      type: Type.STRING, 
      enum: ["Beginner", "Intermediate", "Advanced"] 
    },
    prerequisites: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Short checklist of what is needed before starting." 
    },
    guide: {
      type: Type.ARRAY,
      items: pocStepSchema,
      description: "The full step-by-step tutorial."
    },
    sourceUrl: { type: Type.STRING },
    date: { type: Type.STRING }
  },
  required: ["title", "description", "tools", "skills", "complexity", "guide"]
};

const deepLearningPostSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Headline of the blog post or newsletter segment." },
    summary: { 
      type: Type.STRING, 
      description: "Extensive summary (200-300 words). Explain the core technical concept, the news, and Andrew Ng's perspective if available. Should be readable as a standalone article." 
    },
    url: { type: Type.STRING },
    author: { type: Type.STRING, description: "e.g. 'Andrew Ng', 'The Batch Team'" },
    date: { type: Type.STRING },
    category: { type: Type.STRING, description: "e.g. 'The Batch', 'Research Highlight'" }
  },
  required: ["title", "summary", "url", "category"]
};

const learningResourceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    provider: { type: Type.STRING, description: "e.g. 'OpenAI', 'Anthropic', 'Hugging Face'" },
    summary: { type: Type.STRING, description: "Brief overview of what the course/resource covers." },
    url: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["Course", "Tutorial", "Paper", "Tool"] },
    difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] }
  },
  required: ["title", "provider", "summary", "url", "type"]
};

const briefSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    editorsNote: {
      type: Type.STRING,
      description: "1-3 sentences describing the main themes of the day in simple language.",
    },
    healthcareStories: {
      type: Type.ARRAY,
      items: storySchema,
      description: "Stories specifically related to Healthcare & Life Sciences. Include ALL relevant stories found.",
    },
    techStories: {
      type: Type.ARRAY,
      items: storySchema,
      description: "Stories related to the broader AI & Tech landscape. Include ALL relevant stories found.",
    },
    socialHighlights: {
      type: Type.ARRAY,
      items: socialPostSchema,
      description: "Latest posts from specific X handles (e.g. @ylecun, @karpathy).",
    },
    googlePocItems: {
      type: Type.ARRAY,
      items: pocItemSchema,
      description: "Hands-on POC labs for learning Google AI tools.",
    },
    deepLearningSpotlight: {
      type: Type.ARRAY,
      items: deepLearningPostSchema,
      description: "Detailed summaries of 2-3 recent articles from DeepLearning.AI blogs or 'The Batch'.",
    },
    generalLearningItems: {
      type: Type.ARRAY,
      items: learningResourceSchema,
      description: "Courses and learning resources from other providers (OpenAI, HuggingFace, etc).",
    }
  },
  required: ["editorsNote", "healthcareStories", "techStories", "socialHighlights", "googlePocItems", "deepLearningSpotlight", "generalLearningItems"],
};

const MONITOR_SOURCES = `
MUST CRAWL / SEARCH THESE SPECIFIC SOURCES (Include X/Twitter Updates):
1. Org Accounts: @OpenAI, @AnthropicAI, @GoogleDeepMind, @MetaAI, @HuggingFace
2. Research Leaders: @ylecun, @AndrewYNg, @drfeifei, @karpathy
3. Blogs/News: OpenAI Blog, DeepMind Research, MIT Tech Review (AI), TechCrunch AI, STAT News.
4. LEARNING PLATFORMS: DeepLearning.AI (The Batch/Courses/Short Courses), Hugging Face Blog/Course, Anthropic Cookbook, OpenAI Cookbook.
5. GOOGLE SPECIFIC: Google Cloud Blog (AI), Vertex AI release notes.

INSTRUCTIONS FOR CRAWLING:
- Prioritize posts with links, demos, or release notes.
- Ignore memes or casual chatter.
- Treat tweet threads as single stories.
`;

export const generateBrief = async (inputText: string, useSearch: boolean = false, dateStr: string = ''): Promise<BriefData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let promptText = "";
  let tools = [];

  if (useSearch) {
    promptText = `
      ACT AS AN EXECUTIVE AI ANALYST & TECHNICAL EDUCATOR.
      Today's Date: ${dateStr}.
      
      TASK 1: NEWS BRIEF (Healthcare & Tech)
      Search for the latest AI news (Today/Yesterday) from the MONITOR_SOURCES list.
      ${MONITOR_SOURCES}
      
      CRITICAL INSTRUCTIONS FOR NEWS:
      - FIND EVERYTHING: Do not limit yourself. Capture ALL significant stories from the sources.
      - DETAIL IS KEY: Write detailed summaries (3-5 paragraphs). The user should NOT need to click the link to understand the full nuance, results, or implications.
      - CLUSTER & DEDUPLICATE: If multiple sources cover the same event, merge them into one comprehensive story.

      TASK 2: SOCIAL WIRE (Latest from X)
      Identify 3-5 high-signal posts strictly from these handles: @ylecun, @AndrewYNg, @karpathy, @drfeifei, @OpenAI, @AnthropicAI, @GoogleDeepMind.
      - Look for "Hot Takes", "Research Previews", "Announcements", or "Technical Observations".
      - Exclude simple retweets without context or casual replies.
      - Present these as distinct social posts, NOT news stories.
      
      TASK 3: GOOGLE AI POC LAB (Hands-on Section)
      Generate 2-3 DISTINCT hands-on Proof of Concept (POC) guides using Google AI tools (Vertex AI, Gemini, AI Studio).
      
      TASK 4: DEEPLEARNING.AI SPOTLIGHT (The Batch & Blogs)
      Search for the latest edition of "The Batch" newsletter or recent blog posts from DeepLearning.AI.
      - Select the top 2-3 most interesting segments/articles.
      - GENERATE DETAILED SUMMARIES (200-300 words each).
      - Include the main technical point, why it matters, and any editorial opinion from Andrew Ng.
      - Do NOT summarize courses. Summarize NEWS and ARTICLES.
      
      TASK 5: OTHER LEARNING (Hugging Face / OpenAI / Anthropic)
      Find 2-3 NEW resources from Hugging Face, OpenAI, or Anthropic.
      
      TASK 6: GENERAL GUIDELINES
      - IGNORE: Rumors, marketing fluff.
      - FOCUS: High signal, actionable learning, executive relevance.
    `;
    // Enable Google Search for grounding
    tools = [{ googleSearch: {} }];
  } else {
    promptText = `Here is the raw news feed/text to process:\n\n${inputText}`;
  }

  const systemInstruction = `
You are an Executive AI Analyst and Technical Educator.

TARGET AUDIENCE:
- Healthcare leaders (for news)
- Developers/Product teams (for the POC Lab & Learning)

OUTPUT SECTIONS:
1. Healthcare & Life Sciences News
2. Broader AI & Tech Landscape News
3. Social Highlights (X/Twitter)
4. Google AI POC Lab
5. DeepLearning.AI Spotlight (Blog & Batch Summaries)
6. Other Industry Learning

EDITORIAL RULES:
- News: Neutral, factual, newspaper style.
- Summaries: DETAILED and COMPREHENSIVE.
- Social: Brief, authentic to the source's voice.
- POC Lab: Interactive, step-by-step.
- Learning Spotlight: Provide actual educational content (summaries), not just marketing descriptions.

SPECIAL INSTRUCTION - QUANTITY:
- Do not arbitrarily limit the number of news items. If there are 10 relevant stories, return 10.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: briefSchema,
        temperature: 0.2,
        tools: tools,
        maxOutputTokens: 8192, 
        thinkingConfig: { thinkingBudget: 2048 }, 
      },
    });

    let responseText = response.text;
    if (!responseText) {
      throw new Error("No response from Gemini.");
    }
    
    // Cleanup potential markdown fences if the model adds them despite mimeType
    responseText = responseText.trim();
    if (responseText.startsWith("```json")) {
      responseText = responseText.replace(/^```json/, "").replace(/```$/, "");
    } else if (responseText.startsWith("```")) {
       responseText = responseText.replace(/^```/, "").replace(/```$/, "");
    }

    try {
      const data = JSON.parse(responseText) as BriefData;
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error. Response text was:", responseText);
      throw parseError;
    }
    
  } catch (error) {
    console.error("Error generating brief:", error);
    throw error;
  }
};