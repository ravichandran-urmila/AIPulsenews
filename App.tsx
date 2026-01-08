
import React, { useState, useEffect } from 'react';
import { generateBrief } from './services/geminiService';
import { saveBrief, getBrief, getAvailableEditions } from './services/storage';
import { BriefData, Story, POCItem, LearningResource, DeepLearningPost, SocialPost } from './types';
import { Newspaper, Globe, Edit3, ShieldCheck, Beaker, CheckSquare, ChevronRight, X, Terminal, BookOpen, Layers, Calendar, Archive, Share2, GraduationCap, FileText, Copy, MessageCircle, RefreshCw, Send, ArrowRight } from 'lucide-react';

const DEFAULT_INPUT_PLACEHOLDER = `Paste your news feed...`;

const MONITORED_SOURCES = [
  { name: "@OpenAI", type: "X/Org" },
  { name: "@AnthropicAI", type: "X/Org" },
  { name: "@GoogleDeepMind", type: "X/Org" },
  { name: "@HuggingFace", type: "X/Org" },
  { name: "@AndrewYNg", type: "X/Person" },
  { name: "DeepLearning.AI", type: "Edu" },
  { name: "STAT News", type: "Health" },
];

// Helper to convert pretty date "Monday, October 27, 2025" to "2025-10-27"
const formatToFileDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const StoryCard: React.FC<{ story: Story }> = ({ story }) => (
  <div className="mb-6 pb-6 border-b border-news-divider last:border-0 last:pb-0 group/card">
    <div className="flex flex-col gap-1 mb-2">
       {story.cluster && <span className="font-sans font-black text-[10px] md:text-xs uppercase tracking-[0.15em] text-news-accent">{story.cluster}</span>}
       <div className="flex flex-wrap gap-2 items-center">
        {story.date && <span className="text-[10px] font-sans font-bold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">{story.date}</span>}
        {story.tags.map((tag, idx) => <span key={idx} className="text-[10px] uppercase tracking-wider font-sans font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>)}
      </div>
    </div>
    <h3 className="font-serif text-xl md:text-2xl font-bold leading-tight mb-3 text-news-ink group-hover/card:text-gray-700 transition-colors">{story.headline}</h3>
    <div className="font-body text-gray-700 text-sm md:text-base leading-relaxed mb-3 whitespace-pre-wrap">{story.summary}</div>
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-gray-100">
      <span className="text-xs font-sans text-gray-400 font-medium uppercase tracking-wide truncate max-w-[200px]">{story.source}</span>
      {story.url && <a href={story.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-sans font-bold text-news-ink hover:text-news-accent transition-colors group/link">Read Source <ChevronRight className="w-3 h-3" /></a>}
    </div>
  </div>
);

const SocialCard: React.FC<{ post: SocialPost }> = ({ post }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full min-w-[280px] max-w-[320px] snap-center">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500">{post.handle.substring(1, 3).toUpperCase()}</div>
         <div>
           <div className="font-bold text-sm text-gray-900 leading-none">{post.authorName || post.handle}</div>
           <div className="text-xs text-gray-500 leading-none mt-1">{post.handle}</div>
         </div>
      </div>
    </div>
    <p className="text-sm text-gray-800 leading-relaxed mb-4 flex-grow font-sans">{post.content}</p>
    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto"><span className="text-xs text-gray-400">{post.date}</span></div>
  </div>
);

const DeepLearningCard: React.FC<{ post: DeepLearningPost; onOpen: () => void }> = ({ post, onOpen }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-1 h-full bg-[#0056D2]"></div>
    <div className="pl-3 mb-4 flex-grow">
      <div className="flex justify-between items-start mb-2">
         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 text-[#0056D2]">{post.category || 'DeepLearning.AI'}</span>
         {post.date && <span className="text-xs text-gray-400 font-medium">{post.date}</span>}
      </div>
      <h3 className="font-serif text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-[#0056D2] transition-colors">{post.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-3">{post.summary}</p>
    </div>
    <div className="pl-3 mt-auto flex items-center justify-end">
      <button onClick={onOpen} className="text-xs font-bold uppercase tracking-wider text-[#0056D2] hover:text-blue-800 flex items-center gap-1">Read Analysis <ChevronRight className="w-3 h-3" /></button>
    </div>
  </div>
);

const POCCard: React.FC<{ item: POCItem; onOpen: () => void }> = ({ item, onOpen }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden group">
    <div className={`absolute top-0 left-0 w-1 h-full ${item.complexity === 'Beginner' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
    <div className="pl-3 mb-4">
      <div className="flex justify-between items-start mb-2">
         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-50">{item.complexity}</span>
      </div>
      <h3 className="font-serif text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-700 transition-colors">{item.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
    </div>
    <div className="pl-3 mt-auto flex items-center justify-end">
      <button onClick={onOpen} className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1">Start Lab <ChevronRight className="w-3 h-3" /></button>
    </div>
  </div>
);

// Fix: Added missing LearningCard component to display Other Industry Learning resources
const LearningCard: React.FC<{ item: LearningResource }> = ({ item }) => (
  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-orange-50 text-orange-700">{item.type}</span>
      {item.difficulty && <span className="text-[10px] font-medium text-gray-400 uppercase">{item.difficulty}</span>}
    </div>
    <h4 className="font-bold text-gray-900 leading-tight mb-1 group-hover:text-orange-700 transition-colors">{item.title}</h4>
    <div className="text-xs text-gray-500 mb-2 font-medium">{item.provider}</div>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{item.summary}</p>
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:text-orange-900 uppercase tracking-wider">
      View Resource <ChevronRight className="w-3 h-3" />
    </a>
  </div>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string; color?: string }> = ({ title, subtitle, color = "text-news-ink" }) => (
  <div className={`mb-6 border-b-2 ${color.includes('blue') ? 'border-blue-800' : 'border-news-ink'} pb-2 mt-8 first:mt-0`}>
    <h2 className={`font-sans font-black text-sm md:text-base uppercase tracking-[0.15em] ${color}`}>{title}</h2>
    {subtitle && <p className="font-sans text-xs text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [todayStr, setTodayStr] = useState<string>('');
  const [mode, setMode] = useState<'crawl' | 'manual'>('crawl');
  const [selectedPOC, setSelectedPOC] = useState<POCItem | null>(null);
  const [selectedDeepLearningPost, setSelectedDeepLearningPost] = useState<DeepLearningPost | null>(null);
  const [archiveDates, setArchiveDates] = useState<string[]>([]);
  const [showArchives, setShowArchives] = useState(false);

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tStr = today.toLocaleDateString('en-US', options);
    setTodayStr(tStr);
    setCurrentDate(tStr);

    const init = async () => {
      setLoading(true);
      
      // 1. Sync Archives List from Manifest
      try {
        const manifestRes = await fetch('./data/manifest.json');
        if (manifestRes.ok) {
          const manifestDates = await manifestRes.json() as string[];
          const localDates = getAvailableEditions();
          const combined = Array.from(new Set([...manifestDates, ...localDates]))
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          setArchiveDates(combined);
        } else {
          setArchiveDates(getAvailableEditions());
        }
      } catch (e) {
        setArchiveDates(getAvailableEditions());
      }

      // 2. Load Today's Content
      const todaysBrief = getBrief(tStr);
      if (todaysBrief) {
        setBrief(todaysBrief);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('./data/brief.json');
        if (response.ok) {
          const staticData = await response.json() as BriefData;
          setBrief(staticData);
          saveBrief(tStr, staticData);
        } else {
          await runAutoCrawl(tStr);
        }
      } catch (e) {
        await runAutoCrawl(tStr);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const runAutoCrawl = async (dateKey: string) => {
    setLoading(true);
    try {
      const data = await generateBrief("", true, dateKey);
      setBrief(data);
      saveBrief(dateKey, data);
      setArchiveDates(prev => Array.from(new Set([dateKey, ...prev])).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()));
    } catch (e) {
      console.error("Crawl failed", e);
    } finally { setLoading(false); }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const newData = await generateBrief("", true, todayStr);
      setBrief(newData);
      saveBrief(todayStr, newData);
      setCurrentDate(todayStr);
    } catch (error) { alert("Refresh failed."); } finally { setLoading(false); }
  };

  const loadArchive = async (dateKey: string) => {
    setShowArchives(false);
    
    // 1. Check LocalStorage
    const local = getBrief(dateKey);
    if (local) {
      setBrief(local);
      setCurrentDate(dateKey);
      return;
    }

    // 2. Try fetching datestamped archive from server
    setLoading(true);
    const fileDate = formatToFileDate(dateKey);
    const archiveUrl = `./data/archives/brief-${fileDate}.json`;

    try {
      const res = await fetch(archiveUrl);
      if (res.ok) {
        const data = await res.json() as BriefData;
        setBrief(data);
        saveBrief(dateKey, data); // Cache it locally
        setCurrentDate(dateKey);
      } else if (dateKey === todayStr) {
        // Fallback for today if brief.json is used instead of archives
        const todayRes = await fetch('./data/brief.json');
        if (todayRes.ok) {
          const data = await todayRes.json() as BriefData;
          setBrief(data);
          saveBrief(dateKey, data);
          setCurrentDate(dateKey);
        } else {
          alert("Archive data not found on server.");
        }
      } else {
        alert("Archive data not found for this date.");
      }
    } catch (e) {
      alert("Error loading archive.");
    } finally {
      setLoading(false);
    }
  };

  const isViewingToday = currentDate === todayStr;

  return (
    <div className="min-h-screen bg-[#fbfbf8] text-news-ink font-sans selection:bg-news-accent/20">
      <header className="border-b-4 border-double border-news-ink pt-8 pb-4 px-4 md:px-8 max-w-7xl mx-auto relative">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
          <div className="text-center md:text-left">
            <h1 className="font-serif text-4xl md:text-6xl font-black tracking-tight text-news-ink mb-1 cursor-pointer" onClick={() => loadArchive(todayStr)}>AI Pulse</h1>
            <p className="font-sans text-xs md:text-sm uppercase tracking-[0.2em] font-medium text-gray-500">Executive AI Brief</p>
          </div>
          <div className="flex flex-col items-center md:items-end font-sans text-xs md:text-sm text-gray-500 font-medium gap-1">
             <div className="relative flex items-center gap-3">
                <button onClick={() => { if (navigator.share) { navigator.share({ title: 'AI Pulse', text: `Brief for ${currentDate}`, url: window.location.href }); } }} className="p-1.5 hover:bg-gray-100 rounded-full text-news-ink"><Share2 className="w-4 h-4" /></button>
                <div className="relative">
                  <button onClick={() => setShowArchives(!showArchives)} className="flex items-center gap-2 hover:text-news-accent transition-colors font-bold uppercase tracking-wide border-b border-dashed border-gray-400 pb-0.5"><Calendar className="w-4 h-4" />{currentDate}<Archive className="w-3 h-3 ml-1 opacity-50" /></button>
                  {showArchives && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 shadow-xl rounded-md z-20 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100"><span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Past Editions</span><X className="w-3 h-3 cursor-pointer" onClick={() => setShowArchives(false)} /></div>
                      <div className="max-h-60 overflow-y-auto">
                        {archiveDates.map(d => (<button key={d} onClick={() => loadArchive(d)} className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 border-l-2 ${d === currentDate ? 'border-news-accent text-news-accent font-bold bg-gray-50' : 'border-transparent text-gray-600'}`}>{d}</button>))}
                        {archiveDates.length === 0 && <div className="px-4 py-3 text-xs text-gray-400 italic">No archives found</div>}
                      </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading && (<div className="flex flex-col items-center justify-center min-h-[50vh]"><Globe className="w-12 h-12 text-news-accent animate-pulse mb-4" /><p className="font-serif text-xl italic text-gray-600">Retrieving Intelligence Archive...</p></div>)}
        {brief && !loading && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 border border-gray-200 px-3 py-1 rounded-full">{isViewingToday ? "Today's Edition" : `Archive: ${currentDate}`}</div>
              {isViewingToday ? (<button onClick={handleManualRefresh} className="text-xs font-bold uppercase tracking-wider text-news-accent hover:text-news-ink flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh Feed</button>) : (<button onClick={() => loadArchive(todayStr)} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-news-ink flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Back to Today</button>)}
            </div>
            <div className="bg-white border border-gray-200 p-6 md:p-8 mb-10 relative shadow-sm"><div className="absolute -top-3 left-6 bg-news-bg px-2"><span className="font-sans text-xs font-black uppercase tracking-widest text-news-accent">Editor's Note</span></div><p className="font-serif text-lg md:text-xl italic leading-relaxed text-gray-800">"{brief.editorsNote}"</p></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative mb-16"><div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -ml-[0.5px]"></div>
              <section><SectionHeader title="Healthcare & Life Sciences" subtitle="Clinical Care, Pharma, Biotech" />
                <div className="space-y-2">{brief.healthcareStories.length > 0 ? brief.healthcareStories.map((story, i) => (<StoryCard key={i} story={story} />)) : <p className="text-gray-400 italic font-serif py-8 text-center">No updates.</p>}</div>
              </section>
              <section><SectionHeader title="Broader AI & Tech Landscape" subtitle="Models, Infrastructure, Policy" />
                <div className="space-y-2">{brief.techStories.length > 0 ? brief.techStories.map((story, i) => (<StoryCard key={i} story={story} />)) : <p className="text-gray-400 italic font-serif py-8 text-center">No updates.</p>}</div>
              </section>
            </div>
            {brief.socialHighlights?.length > 0 && (
              <section className="mb-16"><div className="flex items-center gap-3 mb-6 border-b-2 border-gray-200 pb-3"><MessageCircle className="w-5 h-5 text-gray-700" /><div><h2 className="font-sans font-black text-sm md:text-base uppercase tracking-[0.15em] text-gray-800">Social Wire</h2></div></div>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">{brief.socialHighlights.map((post, i) => (<SocialCard key={i} post={post} />))}</div>
              </section>
            )}
            {brief.deepLearningSpotlight?.length > 0 && (
               <section className="mb-12 bg-indigo-50/30 p-6 md:p-8 rounded-xl border border-indigo-100">
                   <SectionHeader title="DeepLearning.AI Spotlight" subtitle="Featured Blogs & 'The Batch' Analysis" color="text-[#0056D2]" />
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{brief.deepLearningSpotlight.map((post, i) => (<DeepLearningCard key={i} post={post} onOpen={() => setSelectedDeepLearningPost(post)} />))}</div>
               </section>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-12 pt-8 border-t-2 border-dashed border-gray-200">
               <section id="poc-lab" className="bg-blue-50/50 p-6 md:p-8 rounded-xl border border-blue-100"><SectionHeader title="Google AI POC Lab" subtitle="Vertex AI & Gemini Guides" color="text-blue-800" />
                  <div className="space-y-6">{brief.googlePocItems?.length > 0 ? brief.googlePocItems.map((item, i) => (<POCCard key={i} item={item} onOpen={() => setSelectedPOC(item)} />)) : <p className="text-gray-500 italic font-serif text-center">No labs.</p>}</div>
               </section>
               <section id="industry-learning" className="bg-orange-50/50 p-6 md:p-8 rounded-xl border border-orange-100"><div className="flex items-center gap-2 mb-6 border-b-2 border-orange-800 pb-2"><GraduationCap className="w-5 h-5 text-orange-800" /><div><h2 className="font-sans font-black text-sm md:text-base uppercase tracking-[0.15em] text-orange-800">Other Industry Learning</h2></div></div>
                  <div className="space-y-4">{brief.generalLearningItems?.length > 0 ? brief.generalLearningItems.map((item, i) => (<LearningCard key={i} item={item} />)) : <p className="text-gray-500 italic font-serif text-center">No updates.</p>}</div>
               </section>
            </div>
          </div>
        )}
      </main>
      {selectedPOC && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"><div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"><div className="p-6 border-b border-gray-200 flex justify-between items-center"><h2 className="text-2xl font-bold">{selectedPOC.title}</h2><button onClick={() => setSelectedPOC(null)}><X className="w-6 h-6" /></button></div><div className="overflow-y-auto p-6"><p className="mb-4">{selectedPOC.description}</p><div className="space-y-4">{selectedPOC.guide.map((s, idx) => (<div key={idx}><h4 className="font-bold">{idx + 1}. {s.stepTitle}</h4><p>{s.instruction}</p>{s.codeSnippet && <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">{s.codeSnippet}</pre>}</div>))}</div></div></div></div>}
      {selectedDeepLearningPost && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"><div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"><div className="p-6 border-b border-gray-200 flex justify-between items-center"><h2 className="text-2xl font-bold">{selectedDeepLearningPost.title}</h2><button onClick={() => setSelectedDeepLearningPost(null)}><X className="w-6 h-6" /></button></div><div className="overflow-y-auto p-6"><div className="bg-blue-50 p-4 rounded mb-4 font-sans leading-relaxed whitespace-pre-wrap">{selectedDeepLearningPost.summary}</div><div className="flex justify-end"><a href={selectedDeepLearningPost.url} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 font-bold">Read Original <ArrowRight className="w-4 h-4" /></a></div></div></div></div>}
    </div>
  );
};

export default App;
