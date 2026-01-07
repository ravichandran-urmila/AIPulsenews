import React, { useState, useEffect } from 'react';
import { generateBrief } from './services/geminiService';
import { saveBrief, getBrief, getAvailableEditions, shouldRunNightlyJob } from './services/storage';
import { BriefData, Story, POCItem, POCStep, LearningResource, DeepLearningPost, SocialPost } from './types';
import { Clock, ExternalLink, RefreshCw, Send, Newspaper, Globe, Edit3, ShieldCheck, Beaker, CheckSquare, ChevronRight, X, Terminal, BookOpen, Layers, Calendar, Archive, Share2, GraduationCap, ArrowLeft, ArrowRight, Video, FileText, Lightbulb, PlayCircle, Copy, MessageCircle } from 'lucide-react';

const DEFAULT_INPUT_PLACEHOLDER = `Paste your news feed, article snippets, tweets, or notes here...

Example:
OpenAI launched a new reasoning model today called o1. It performs well on math benchmarks.
Mayo Clinic is testing a new AI scribe tool that reduced documentation time by 50%.
Google DeepMind announced AlphaFold 3 with improved protein structure prediction.
`;

const MONITORED_SOURCES = [
  { name: "@OpenAI", type: "X/Org" },
  { name: "@AnthropicAI", type: "X/Org" },
  { name: "@GoogleDeepMind", type: "X/Org" },
  { name: "@HuggingFace", type: "X/Org" },
  { name: "@AndrewYNg", type: "X/Person" },
  { name: "DeepLearning.AI", type: "Edu" },
  { name: "STAT News", type: "Health" },
];

const shareContent = async (title: string, text: string, url?: string) => {
  const shareData: any = { title, text };
  if (url) shareData.url = url;

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log("Share cancelled/failed", err);
    }
  } else {
    const contentToCopy = `${title}\n\n${text}\n${url ? `\nSource: ${url}` : ''}`;
    try {
      await navigator.clipboard.writeText(contentToCopy);
      alert("Content copied to clipboard!");
    } catch (err) {
      console.error("Clipboard write failed", err);
    }
  }
};

const StoryCard: React.FC<{ story: Story }> = ({ story }) => {
  return (
    <div className="mb-6 pb-6 border-b border-news-divider last:border-0 last:pb-0 group/card">
      <div className="flex flex-col gap-1 mb-2">
         {story.cluster && (
           <span className="font-sans font-black text-[10px] md:text-xs uppercase tracking-[0.15em] text-news-accent">
             {story.cluster}
           </span>
         )}
         <div className="flex flex-wrap gap-2 items-center">
          {story.date && (
             <span className="text-[10px] font-sans font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
               {story.date}
             </span>
          )}
          {story.tags.map((tag, idx) => (
            <span key={idx} className="text-[10px] uppercase tracking-wider font-sans font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <h3 className="font-serif text-xl md:text-2xl font-bold leading-tight mb-3 text-news-ink group-hover/card:text-gray-700 transition-colors">
        {story.headline}
      </h3>
      <div className="font-body text-gray-700 text-sm md:text-base leading-relaxed mb-3 whitespace-pre-wrap">
        {story.summary}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-gray-100">
        <span className="text-xs font-sans text-gray-400 font-medium uppercase tracking-wide truncate max-w-[200px]">
          {story.source}
        </span>
        {story.url && (
          <a 
            href={story.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1 text-xs font-sans font-bold text-news-ink hover:text-news-accent transition-colors group/link"
          >
            Read Source
            <ExternalLink className="w-3 h-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
          </a>
        )}
      </div>
    </div>
  );
};

// --- SOCIAL POST CARD ---
const SocialCard: React.FC<{ post: SocialPost }> = ({ post }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full min-w-[280px] max-w-[320px] snap-center">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500">
              {post.handle.substring(1, 3).toUpperCase()}
           </div>
           <div>
             <div className="font-bold text-sm text-gray-900 leading-none">{post.authorName || post.handle}</div>
             <div className="text-xs text-gray-500 leading-none mt-1">{post.handle}</div>
           </div>
        </div>
        {post.type && (
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
            post.type === 'Research' ? 'bg-purple-50 text-purple-700' :
            post.type === 'Announcement' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {post.type}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-800 leading-relaxed mb-4 flex-grow font-sans">
        {post.content}
      </p>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
         <span className="text-xs text-gray-400">{post.date}</span>
         {post.url && (
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-news-accent">
               <ExternalLink className="w-3.5 h-3.5" />
            </a>
         )}
      </div>
    </div>
  );
};

// --- LEARNING RESOURCE CARD ---
const LearningCard: React.FC<{ item: LearningResource }> = ({ item }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
       <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
             {item.provider}
          </span>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
             item.difficulty === 'Beginner' ? 'text-green-700 bg-green-50' : 
             item.difficulty === 'Intermediate' ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
          }`}>
             {item.difficulty || 'All Levels'}
          </span>
       </div>
       <h3 className="font-serif text-lg font-bold text-gray-900 leading-tight mb-2">
         {item.title}
       </h3>
       <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">
         {item.summary}
       </p>
       <div className="pt-3 border-t border-gray-100 mt-auto">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider text-news-accent hover:text-news-ink flex items-center gap-1"
          >
             Go to Resource <ExternalLink className="w-3 h-3" />
          </a>
       </div>
    </div>
  );
};

// --- DEEPLEARNING.AI COMPONENTS ---

const DeepLearningDetailModal: React.FC<{ post: DeepLearningPost; onClose: () => void }> = ({ post, onClose }) => {
  const handleCopyNotes = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Summary copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header - Matching branding but structrued like POC modal */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50">
          <div>
             <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0056D2] bg-blue-50 px-2 py-0.5 rounded">
                   {post.category || 'DeepLearning.AI'}
                </span>
                <span className="text-gray-400 text-xs font-sans font-bold">•</span>
                <span className="text-gray-500 text-xs font-sans font-bold uppercase tracking-wide">Analysis</span>
             </div>
             <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
               {post.title}
             </h2>
             {post.author && (
                <p className="font-sans text-gray-600 mt-2 font-medium">
                  By {post.author} {post.date && `• ${post.date}`}
                </p>
             )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => shareContent(post.title, post.summary, post.url)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              title="Share"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8">
           <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-6 mb-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Executive Summary
                </h4>
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap font-sans text-base">
                   {post.summary}
                </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
             onClick={() => handleCopyNotes(`${post.title}\n\n${post.summary}`)}
             className="px-5 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded flex items-center gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Text
          </button>
          <a 
             href={post.url} 
             target="_blank" 
             rel="noreferrer"
             className="px-5 py-2 bg-[#0056D2] text-white font-bold text-sm rounded shadow-sm hover:bg-blue-700 flex items-center gap-2"
          >
             Read Original <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

const DeepLearningCard: React.FC<{ post: DeepLearningPost; onOpen: () => void }> = ({ post, onOpen }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#0056D2]"></div>
      
      <div className="pl-3 mb-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
           <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-[#0056D2]">
             {post.category || 'DeepLearning.AI'}
           </span>
           {post.date && <span className="text-xs text-gray-400 font-medium">{post.date}</span>}
        </div>
        <h3 className="font-serif text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-[#0056D2] transition-colors">
          {post.title}
        </h3>
         {post.author && (
            <div className="text-xs text-gray-500 font-medium mb-2">By {post.author}</div>
         )}
        <p className="text-sm text-gray-600 line-clamp-3">
          {post.summary}
        </p>
      </div>

      <div className="pl-3 mt-auto space-y-3">
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
           <button 
                onClick={(e) => {
                    e.stopPropagation();
                    shareContent(post.title, post.summary, post.url);
                }}
                className="text-gray-400 hover:text-[#0056D2] transition-colors"
                title="Share Article"
              >
                 <Share2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onOpen}
            className="text-xs font-bold uppercase tracking-wider text-[#0056D2] hover:text-blue-800 flex items-center gap-1"
          >
            Read Analysis <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- POC COMPONENTS ---

const POCDetailModal: React.FC<{ item: POCItem; onClose: () => void }> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 text-[10px] uppercase font-black tracking-widest rounded ${
                item.complexity === 'Beginner' ? 'bg-green-100 text-green-700' :
                item.complexity === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {item.complexity} Lab
              </span>
              <span className="text-gray-400 text-xs font-sans font-bold">•</span>
              <span className="text-gray-500 text-xs font-sans font-bold uppercase tracking-wide">30-60 Mins</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {item.title}
            </h2>
            <p className="font-sans text-gray-600 mt-2 max-w-2xl">
              {item.description}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* Prerequisites */}
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
            <h4 className="text-xs font-black uppercase tracking-widest text-yellow-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Before you start
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {item.prerequisites.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-yellow-900/80 font-medium">
                  <CheckSquare className="w-4 h-4 opacity-50" /> {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
             <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">
               <Terminal className="w-5 h-5 text-blue-600" /> Builder Guide
             </h3>
             <div className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-3.5 top-2 bottom-0 w-0.5 bg-gray-100"></div>

                {item.guide.map((step, idx) => (
                  <div key={idx} className="relative pl-10">
                    {/* Step Number Bubble */}
                    <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center z-10">
                      <span className="font-bold text-blue-600 text-sm">{idx + 1}</span>
                    </div>

                    <div className="bg-white">
                      <h4 className="font-sans font-bold text-lg text-gray-900 mb-2">{step.stepTitle}</h4>
                      <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{step.instruction}</p>
                      
                      {step.codeSnippet && (
                        <div className="bg-gray-900 rounded-md p-4 overflow-x-auto border border-gray-800 shadow-inner">
                          <pre className="font-mono text-sm text-gray-100">{step.codeSnippet}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200 rounded">
            Close Lab
          </button>
          {item.sourceUrl && (
             <a 
               href={item.sourceUrl} 
               target="_blank" 
               rel="noreferrer"
               className="px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded shadow-sm hover:bg-blue-700 flex items-center gap-2"
             >
               Official Docs <ExternalLink className="w-4 h-4" />
             </a>
          )}
        </div>
      </div>
    </div>
  );
};

const POCCard: React.FC<{ item: POCItem; onOpen: () => void }> = ({ item, onOpen }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1 h-full ${
        item.complexity === 'Beginner' ? 'bg-green-500' :
        item.complexity === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
      }`}></div>
      
      <div className="pl-3 mb-4">
        <div className="flex justify-between items-start mb-2">
           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
             item.complexity === 'Beginner' ? 'bg-green-50 text-green-700' :
             item.complexity === 'Intermediate' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
           }`}>
             {item.complexity}
           </span>
           {item.date && <span className="text-xs text-gray-400 font-medium">{item.date}</span>}
        </div>
        <h3 className="font-serif text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-700 transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {item.description}
        </p>
      </div>

      <div className="pl-3 mt-auto space-y-3">
        <div className="flex flex-wrap gap-1">
          {item.tools.slice(0, 3).map((tool, i) => (
             <span key={i} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
               {tool}
             </span>
          ))}
          {item.tools.length > 3 && <span className="text-[10px] text-gray-400 px-1 py-0.5">+{item.tools.length - 3}</span>}
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
            <Layers className="w-3 h-3" />
            {item.skills.length} Skills
          </div>
          <button 
            onClick={onOpen}
            className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Start Lab <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; subtitle?: string; color?: string }> = ({ title, subtitle, color = "text-news-ink" }) => (
  <div className={`mb-6 border-b-2 ${color === 'text-blue-800' ? 'border-blue-800' : color === 'text-[#0056D2]' ? 'border-[#0056D2]' : 'border-news-ink'} pb-2 mt-8 first:mt-0`}>
    <h2 className={`font-sans font-black text-sm md:text-base uppercase tracking-[0.15em] ${color}`}>
      {title}
    </h2>
    {subtitle && <p className="font-sans text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const App: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [currentDate, setCurrentDate] = useState<string>(''); // The date currently being viewed
  const [todayStr, setTodayStr] = useState<string>(''); // Today's actual date
  const [mode, setMode] = useState<'crawl' | 'manual'>('crawl');
  const [selectedPOC, setSelectedPOC] = useState<POCItem | null>(null);
  const [selectedDeepLearningPost, setSelectedDeepLearningPost] = useState<DeepLearningPost | null>(null);
  const [archiveDates, setArchiveDates] = useState<string[]>([]);
  const [showArchives, setShowArchives] = useState(false);

  useEffect(() => {
    // 1. Determine "Today"
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const tStr = today.toLocaleDateString('en-US', options);
    setTodayStr(tStr);
    setCurrentDate(tStr);

    // 2. Load Archives list
    const available = getAvailableEditions();
    setArchiveDates(available);

    // 3. Automated "Nightly Run" Logic
    const init = async () => {
      // Check if we already have today's edition
      const todaysBrief = getBrief(tStr);
      
      if (todaysBrief) {
        console.log("Loaded today's brief from storage.");
        setBrief(todaysBrief);
      } else {
        console.log("No brief for today. Triggering auto-run...");
        await runAutoCrawl(tStr);
      }
    };

    init();
  }, []);

  // Helper to merge new crawl data with existing data to prevent data loss
  const mergeBriefData = (existing: BriefData, incoming: BriefData): BriefData => {
    const mergeStories = (oldStories: Story[], newStories: Story[]) => {
      // Create a map by headline/url to prevent duplicates
      const map = new Map();
      
      // Add old stories first
      oldStories.forEach(s => map.set(s.headline + (s.url || ''), s));
      
      // Add new stories 
      newStories.forEach(s => {
        const exists = Array.from(map.values()).some((os: any) => 
          os.headline.toLowerCase().includes(s.headline.toLowerCase()) || 
          s.headline.toLowerCase().includes(os.headline.toLowerCase())
        );
        if (!exists) {
          map.set(s.headline + (s.url || ''), s);
        }
      });
      
      return Array.from(map.values());
    };

    return {
      editorsNote: incoming.editorsNote.length > existing.editorsNote.length ? incoming.editorsNote : existing.editorsNote, 
      healthcareStories: mergeStories(existing.healthcareStories, incoming.healthcareStories) as Story[],
      techStories: mergeStories(existing.techStories, incoming.techStories) as Story[],
      socialHighlights: incoming.socialHighlights && incoming.socialHighlights.length > 0 
        ? incoming.socialHighlights 
        : (existing.socialHighlights || []),
      googlePocItems: incoming.googlePocItems.length > 0 ? incoming.googlePocItems : existing.googlePocItems,
      deepLearningSpotlight: incoming.deepLearningSpotlight && incoming.deepLearningSpotlight.length > 0 
         ? incoming.deepLearningSpotlight 
         : (existing.deepLearningSpotlight || []),
      generalLearningItems: incoming.generalLearningItems && incoming.generalLearningItems.length > 0 
         ? incoming.generalLearningItems 
         : (existing.generalLearningItems || []),
      timestamp: Date.now()
    };
  };

  const runAutoCrawl = async (dateKey: string) => {
    setLoading(true);
    try {
      // Auto-run implies 'crawl' mode
      const data = await generateBrief("", true, dateKey);
      setBrief(data);
      saveBrief(dateKey, data);
      // Update archives list after saving new one
      setArchiveDates(getAvailableEditions());
    } catch (e) {
      console.error("Auto-crawl failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (mode === 'manual' && !input.trim()) return;
    
    setLoading(true);
    try {
      // Refreshing "Today" means re-crawling/generating for todayStr
      const newData = await generateBrief(input, mode === 'crawl', todayStr);
      
      let finalData = newData;
      if (brief && currentDate === todayStr) {
        // Merge with existing data so we don't lose previous stories
        finalData = mergeBriefData(brief, newData);
      }

      setBrief(finalData);
      saveBrief(todayStr, finalData); // Overwrite/Update today's entry
      setCurrentDate(todayStr); // Ensure we are viewing today
    } catch (error) {
      alert("Failed to refresh brief. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Pulse - Executive Brief',
          text: `Check out today's AI Executive Brief for ${currentDate}.`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      alert("Sharing not supported on this browser, or URL copied to clipboard!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const loadArchive = (dateKey: string) => {
    const data = getBrief(dateKey);
    if (data) {
      setBrief(data);
      setCurrentDate(dateKey);
      setShowArchives(false);
    }
  };

  const isViewingToday = currentDate === todayStr;

  return (
    <div className="min-h-screen bg-[#fbfbf8] text-news-ink font-sans selection:bg-news-accent/20">
      
      {/* --- MASTHEAD --- */}
      <header className="border-b-4 border-double border-news-ink pt-8 pb-4 px-4 md:px-8 max-w-7xl mx-auto relative">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <div className="text-center md:text-left">
            <h1 className="font-serif text-4xl md:text-6xl font-black tracking-tight text-news-ink mb-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => loadArchive(todayStr)}>
              AI Pulse
            </h1>
            <p className="font-sans text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-gray-500">
              Executive AI Brief
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end font-sans text-xs md:text-sm text-gray-500 font-medium gap-1">
             <div className="relative flex items-center gap-3">
                <button 
                   onClick={handleShare}
                   className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-news-ink"
                   title="Share this brief"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowArchives(!showArchives)}
                    className="flex items-center gap-2 hover:text-news-accent transition-colors font-bold uppercase tracking-wide border-b border-dashed border-gray-400 pb-0.5"
                  >
                    <Calendar className="w-4 h-4" />
                    {currentDate}
                    <Archive className="w-3 h-3 ml-1 opacity-50" />
                  </button>

                  {/* Archives Dropdown */}
                  {showArchives && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-md z-20 overflow-hidden animate-fade-in">
                      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Past Editions</span>
                         <X className="w-3 h-3 cursor-pointer text-gray-400" onClick={() => setShowArchives(false)} />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {archiveDates.map(d => (
                          <button
                            key={d}
                            onClick={() => loadArchive(d)}
                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 transition-colors border-l-2 ${d === currentDate ? 'border-news-accent text-news-accent font-bold bg-gray-50' : 'border-transparent text-gray-600'}`}
                          >
                            {d}
                          </button>
                        ))}
                        {archiveDates.length === 0 && (
                          <div className="px-4 py-3 text-xs text-gray-400 italic">No archives yet</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
             </div>

             <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-400">
                <span>Vol. {new Date().getFullYear()}.{new Date().getMonth() + 1}</span>
                <span>•</span>
                {brief?.timestamp ? (
                   <span>Last Updated: {new Date(brief.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                ) : (
                  <span>Daily Intelligence</span>
                )}
             </div>
          </div>
        </div>
        <div className="w-full border-t border-news-ink mt-2"></div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* --- INPUT / CRAWL SELECTION (Only show if viewing TODAY) --- */}
        {!brief && !loading && isViewingToday && (
          <div className="max-w-3xl mx-auto mt-8 bg-white p-6 md:p-8 shadow-sm border border-gray-200">
            {/* ... Existing Input UI ... */}
            <div className="flex justify-center mb-8 border-b border-gray-100 pb-6">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setMode('crawl')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all ${
                    mode === 'crawl' 
                    ? 'bg-white text-news-accent shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Globe className="w-4 h-4" /> Live Web Crawl
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold uppercase tracking-wide transition-all ${
                    mode === 'manual' 
                    ? 'bg-white text-news-accent shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Edit3 className="w-4 h-4" /> Manual Input
                </button>
              </div>
            </div>

            {/* CRAWL MODE UI */}
            {mode === 'crawl' && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <ShieldCheck className="w-10 h-10 mx-auto text-news-accent mb-3 opacity-80" />
                  <h2 className="font-serif text-2xl font-bold mb-2">Automated Source Monitor</h2>
                  <p className="text-gray-600 max-w-lg mx-auto">
                    Scanning organization accounts, research leaders, and trusted news outlets.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 mb-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 text-center">Active Sources</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {MONITORED_SOURCES.map((source) => (
                      <span key={source.name} className="inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium bg-white border border-gray-200 text-gray-700">
                        {source.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleManualRefresh}
                    className="flex items-center gap-2 bg-news-ink text-white px-8 py-4 font-sans font-bold uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Fetch Latest Intelligence
                  </button>
                </div>
              </div>
            )}

            {/* MANUAL MODE UI */}
            {mode === 'manual' && (
              <div className="animate-fade-in">
                 <div className="text-center mb-4">
                  <h2 className="font-serif text-xl font-bold">Manual Entry</h2>
                  <p className="text-sm text-gray-500">Paste snippets or notes to process.</p>
                </div>
                <textarea
                  className="w-full h-48 p-4 border border-gray-300 font-mono text-sm focus:ring-2 focus:ring-news-accent focus:border-news-accent outline-none transition-all resize-none bg-gray-50 mb-4"
                  placeholder={DEFAULT_INPUT_PLACEHOLDER}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleManualRefresh}
                    disabled={!input.trim()}
                    className="flex items-center gap-2 bg-news-ink text-white px-6 py-3 font-sans font-bold uppercase tracking-wider text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Generate Brief
                  </button>
                </div>
              </div>
            )}
            
          </div>
        )}

        {/* --- LOADING STATE --- */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Globe className="w-12 h-12 text-news-accent animate-pulse mb-4" />
            <p className="font-serif text-xl italic text-gray-600">
              {mode === 'crawl' ? 'Scanning X, News, and Learning Platforms...' : 'Analyzing text...'}
            </p>
            <p className="font-sans text-xs text-gray-400 mt-2 uppercase tracking-widest">
              Synthesizing Executive Summary
            </p>
          </div>
        )}

        {/* --- NEWSPAPER VIEW --- */}
        {brief && !loading && (
          <div className="animate-fade-in">
            {/* ACTION BAR (Only enabled for Today) */}
            <div className="flex justify-between items-center mb-6 print:hidden">
              <div className="flex items-center gap-2">
                 {/* Navigation for Prev/Next Day could go here if implemented, for now just Label */}
                 <div className="text-xs font-bold uppercase tracking-widest text-gray-400 border border-gray-200 px-3 py-1 rounded-full">
                   {isViewingToday ? "Today's Edition" : `Archived: ${currentDate}`}
                 </div>
              </div>
              
              {isViewingToday ? (
                <button 
                  onClick={handleManualRefresh} 
                  className="text-xs font-bold uppercase tracking-wider text-news-accent hover:text-news-ink flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Get More Recent Updates
                </button>
              ) : (
                <button 
                   onClick={() => {
                     setCurrentDate(todayStr); 
                     const t = getBrief(todayStr);
                     if(t) setBrief(t);
                     else { setBrief(null); runAutoCrawl(todayStr); }
                   }}
                   className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-news-ink flex items-center gap-1 transition-colors"
                >
                  <ArrowRightCircle className="w-3 h-3" /> Go to Today
                </button>
              )}
            </div>

            {/* EDITOR'S NOTE */}
            <div className="bg-white border border-gray-200 p-6 md:p-8 mb-10 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
               <div className="absolute -top-3 left-6 bg-news-bg px-2">
                 <span className="font-sans text-xs font-black uppercase tracking-widest text-news-accent">
                   Editor's Note
                 </span>
               </div>
               <p className="font-serif text-lg md:text-xl italic leading-relaxed text-gray-800">
                 "{brief.editorsNote}"
               </p>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative mb-16">
              
              {/* Vertical Divider for Desktop */}
              <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -ml-[0.5px]"></div>

              {/* COLUMN 1: HEALTHCARE */}
              <section>
                <SectionHeader 
                  title="Healthcare & Life Sciences" 
                  subtitle="Clinical Care, Pharma, Biotech, Operations"
                />
                
                <div className="space-y-2">
                  {brief.healthcareStories.length > 0 ? (
                    brief.healthcareStories.map((story, i) => (
                      <StoryCard key={i} story={story} />
                    ))
                  ) : (
                    <p className="text-gray-400 italic font-serif py-8 text-center">No significant healthcare updates reported today.</p>
                  )}
                </div>
              </section>

              {/* COLUMN 2: TECH */}
              <section>
                <SectionHeader 
                  title="Broader AI & Tech Landscape" 
                  subtitle="Models, Infrastructure, Policy, Enterprise"
                />
                
                <div className="space-y-2">
                  {brief.techStories.length > 0 ? (
                    brief.techStories.map((story, i) => (
                      <StoryCard key={i} story={story} />
                    ))
                  ) : (
                    <p className="text-gray-400 italic font-serif py-8 text-center">No general tech updates reported today.</p>
                  )}
                </div>
              </section>
            </div>
            
            {/* NEW: SOCIAL WIRE (X/Twitter) SECTION */}
            {brief.socialHighlights && brief.socialHighlights.length > 0 && (
              <section className="mb-16">
                 <div className="flex items-center gap-3 mb-6 border-b-2 border-gray-200 pb-3">
                    <MessageCircle className="w-5 h-5 text-gray-700" />
                    <div>
                       <h2 className="font-sans font-black text-sm md:text-base uppercase tracking-[0.15em] text-gray-800">
                          Social Wire
                       </h2>
                       <p className="font-sans text-xs text-gray-500 mt-0.5">
                          Latest from Research Leaders & Organizations
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                    {brief.socialHighlights.map((post, i) => (
                       <SocialCard key={i} post={post} />
                    ))}
                 </div>
              </section>
            )}
            
            {/* DEEPLEARNING.AI SPOTLIGHT (REFACTORED) */}
             {brief.deepLearningSpotlight && brief.deepLearningSpotlight.length > 0 && (
               <section className="mb-12 bg-indigo-50/30 p-6 md:p-8 rounded-xl border border-indigo-100">
                   <SectionHeader 
                      title="DeepLearning.AI Spotlight" 
                      subtitle="Analysis of 'The Batch' & Featured Blogs"
                      color="text-[#0056D2]"
                   />
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {brief.deepLearningSpotlight.map((post, i) => (
                           <DeepLearningCard key={i} post={post} onOpen={() => setSelectedDeepLearningPost(post)} />
                       ))}
                   </div>
               </section>
             )}

            {/* SECTION 3: LEARNING & POC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-12 pt-8 border-t-2 border-dashed border-gray-200">
               
               {/* POC LAB */}
               <section id="poc-lab" className="bg-blue-50/50 p-6 md:p-8 rounded-xl border border-blue-100">
                  <SectionHeader 
                    title="Google AI POC Lab" 
                    subtitle="Hands-on guides (Vertex AI, Gemini)"
                    color="text-blue-800"
                  />
                  <div className="space-y-6">
                     {brief.googlePocItems && brief.googlePocItems.length > 0 ? (
                       brief.googlePocItems.map((item, i) => (
                         <div key={i} className="h-full">
                           <POCCard item={item} onOpen={() => setSelectedPOC(item)} />
                         </div>
                       ))
                     ) : (
                       <p className="text-gray-500 italic font-serif text-center">No POC labs available.</p>
                     )}
                  </div>
               </section>

               {/* INDUSTRY LEARNING (General) */}
               <section id="industry-learning" className="bg-orange-50/50 p-6 md:p-8 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-2 mb-6 border-b-2 border-orange-800 pb-2">
                    <GraduationCap className="w-5 h-5 text-orange-800" />
                    <div>
                      <h2 className="font-sans font-black text-sm md:text-base uppercase tracking-[0.15em] text-orange-800">
                        Other Industry Learning
                      </h2>
                      <p className="font-sans text-xs text-gray-500 mt-1">Hugging Face, OpenAI, Anthropic</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     {brief.generalLearningItems && brief.generalLearningItems.length > 0 ? (
                       brief.generalLearningItems.map((item, i) => (
                         <div key={i} className="h-auto">
                           <LearningCard item={item} />
                         </div>
                       ))
                     ) : (
                       <p className="text-gray-500 italic font-serif text-center">No other industry learning updates found.</p>
                     )}
                  </div>
               </section>

            </div>

            {/* FOOTER */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center">
              <p className="font-serif italic text-gray-400 text-sm">
                Generated by Gemini Studio • AI Pulse Executive Brief
              </p>
            </div>
          </div>
        )}

        {/* --- MODALS --- */}
        {selectedPOC && (
          <POCDetailModal item={selectedPOC} onClose={() => setSelectedPOC(null)} />
        )}
        
        {selectedDeepLearningPost && (
          <DeepLearningDetailModal post={selectedDeepLearningPost} onClose={() => setSelectedDeepLearningPost(null)} />
        )}

      </main>
    </div>
  );
};

const ArrowRightCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 16l4-4-4-4"></path></svg>
);

export default App;