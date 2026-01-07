export interface Story {
  headline: string;
  summary: string;
  source: string;
  tags: string[];
  cluster?: string; // E.g. "Google / DeepMind", "OpenAI", "Regulation"
  url?: string;
  impact?: string; // Why it matters
  date?: string; // Date of the event/article
}

export interface SocialPost {
  handle: string; // e.g. @ylecun
  authorName?: string; // e.g. Yann LeCun
  content: string; // The post text or summary
  url?: string;
  date?: string;
  type?: 'Announcement' | 'Opinion' | 'Research';
}

export interface POCStep {
  stepTitle: string;
  instruction: string; // Plain text explanation of what to do
  codeSnippet?: string; // Optional code block or CLI command
}

export interface POCItem {
  title: string;
  description: string; // "What you'll build"
  tools: string[]; // List of tools used e.g. "Vertex AI", "LangChain"
  skills: string[]; // List of skills learned e.g. "Prompt Engineering"
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[]; // Short checklist
  guide: POCStep[]; // The full step-by-step walkthrough
  sourceUrl?: string; // Link to official docs
  date?: string;
}

export interface DeepLearningPost {
  title: string;
  summary: string; // Detailed summary of the blog post/article
  url: string;
  author?: string;
  date?: string;
  category?: string; // e.g. "The Batch", "Research", "Engineering"
}

export interface LearningResource {
  title: string;
  provider: string; // e.g. "OpenAI", "Hugging Face"
  summary: string;
  url: string;
  type: 'Course' | 'Tutorial' | 'Paper' | 'Tool';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface BriefData {
  editorsNote: string;
  healthcareStories: Story[];
  techStories: Story[];
  socialHighlights: SocialPost[]; 
  googlePocItems: POCItem[]; 
  deepLearningSpotlight: DeepLearningPost[]; // CHANGED: List of blog posts
  generalLearningItems: LearningResource[]; 
  timestamp?: number; 
}

export interface GenerateBriefRequest {
  inputText: string;
}