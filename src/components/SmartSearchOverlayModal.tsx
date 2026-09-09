import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  Tag, 
  ArrowRight, 
  Star, 
  Sparkles, 
  History, 
  Sun, 
  Moon, 
  Flame, 
  TrendingUp, 
  ArrowUpRight, 
  Zap, 
  Download 
} from 'lucide-react';
import { Product } from '../types';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { db, getUserProfileFromFirestore } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { rankProductsWithGemini, scoreProductRelevance, AIUserProfile } from '../utils/aiRecommender';

interface SmartSearchOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: string) => void;
}

// Substring highlighter for instant visual feedback while typing
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark 
            key={i} 
            className="bg-emerald-400/30 text-emerald-800 dark:text-emerald-300 font-black rounded-xs px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export const SmartSearchOverlayModal: React.FC<SmartSearchOverlayModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSelectCategory,
}) => {
  const { products } = useProducts();
  const { currentUser } = useAuth();
  const { darkMode, toggleTheme, globalConfig } = useGlobalSettings();
  const [query, setQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [aiRankedResults, setAiRankedResults] = useState<Product[] | null>(null);
  const [isAiRanking, setIsAiRanking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Loaded user profile for interest-based matches
  const [profile, setProfile] = useState<AIUserProfile>({
    searchHistory: [],
    viewedCategories: {},
    viewedTags: []
  });

  // Load user profile & search history
  useEffect(() => {
    if (!isOpen) return;

    const loadProfile = async () => {
      let loadedProfile: AIUserProfile = {
        searchHistory: [],
        viewedCategories: {},
        viewedTags: []
      };

      if (currentUser) {
        try {
          const userDoc = await getUserProfileFromFirestore(currentUser.uid);
          if (userDoc) {
            const viewedCategories: Record<string, number> = {};
            if (userDoc.recentInterests) {
              userDoc.recentInterests.forEach(cat => {
                viewedCategories[cat] = (viewedCategories[cat] || 0) + 1;
              });
            }
            loadedProfile = {
              searchHistory: userDoc.searchHistory || [],
              viewedCategories,
              viewedTags: userDoc.recentTags || []
            };
          }
        } catch (err) {
          console.warn("Failed to load user profile in search overlay:", err);
        }
      } else {
        try {
          const localInterests = localStorage.getItem('fm_anon_interests');
          const localTags = localStorage.getItem('fm_anon_tags');
          const localHistory = localStorage.getItem('fm_anon_searches');

          const viewedCategories: Record<string, number> = {};
          if (localInterests) {
            const interests: string[] = JSON.parse(localInterests);
            interests.forEach(cat => {
              viewedCategories[cat] = (viewedCategories[cat] || 0) + 1;
            });
          }

          loadedProfile = {
            searchHistory: localHistory ? JSON.parse(localHistory) : [],
            viewedCategories,
            viewedTags: localTags ? JSON.parse(localTags) : []
          };
        } catch {}
      }

      setProfile(loadedProfile);
    };

    loadProfile();
  }, [isOpen, currentUser]);

  // Handle modal lifecycle & body lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setSelectedChip(null);
      setAiRankedResults(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 1. Compute Global Category Stats & Trending Popularity
  const categoryStatsList = useMemo(() => {
    const map: Record<string, { count: number; totalDownloads: number; avgRating: number }> = {};
    
    // Seed from globalConfig categories if available
    if (globalConfig?.categories) {
      globalConfig.categories.forEach(c => {
        if (!map[c.name]) {
          map[c.name] = { count: 0, totalDownloads: 0, avgRating: 0 };
        }
      });
    }

    products.forEach(p => {
      if (!p.category) return;
      if (!map[p.category]) {
        map[p.category] = { count: 0, totalDownloads: 0, avgRating: 0 };
      }
      map[p.category].count += 1;
      map[p.category].totalDownloads += (p.downloadsCount || 0);
      map[p.category].avgRating += (p.rating || 4.8);
    });

    return Object.entries(map)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        totalDownloads: stats.totalDownloads,
        avgRating: stats.count > 0 ? Number((stats.avgRating / stats.count).toFixed(1)) : 5.0,
        isTrending: stats.totalDownloads >= 80 || stats.count >= 2
      }))
      .sort((a, b) => b.totalDownloads - a.totalDownloads || b.count - a.count);
  }, [products, globalConfig]);

  // 2. Compute Top-Performing Products Overall (Bestsellers, highest downloads, verified ratings)
  const topPerformingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const scoreA = 
          (a.downloadsCount || 0) * 1.5 + 
          (a.rating || 0) * 40 + 
          (a.isBestSeller ? 200 : 0) + 
          (a.isFeatured ? 100 : 0);
        const scoreB = 
          (b.downloadsCount || 0) * 1.5 + 
          (b.rating || 0) * 40 + 
          (b.isBestSeller ? 200 : 0) + 
          (b.isFeatured ? 100 : 0);
        return scoreB - scoreA;
      });
  }, [products]);

  // 3. 0ms Instant Keyword & Relevance Search (Updates instantaneously as user types)
  const instantSearchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, pre-sort by user profile relevance
      return [...products].sort((a, b) => {
        return scoreProductRelevance(b, profile) - scoreProductRelevance(a, profile);
      });
    }

    const words = q.split(/\s+/).filter(Boolean);

    return products
      .map(p => {
        let score = 0;
        const titleLower = p.title.toLowerCase();
        const descLower = (p.description || '').toLowerCase();
        const catLower = (p.category || '').toLowerCase();
        const tags = (p.tags || []).map(t => t.toLowerCase());
        const keywords = (p.keywords || []).map(k => k.toLowerCase());

        // Exact match boosts
        if (titleLower === q) score += 150;
        else if (titleLower.startsWith(q)) score += 80;
        else if (titleLower.includes(q)) score += 50;

        if (catLower.includes(q)) score += 40;

        // Tokenized word matching
        words.forEach(w => {
          if (titleLower.includes(w)) score += 25;
          if (catLower.includes(w)) score += 18;
          if (tags.some(t => t.includes(w))) score += 14;
          if (keywords.some(k => k.includes(w))) score += 14;
          if (descLower.includes(w)) score += 8;
        });

        // Top-performer boost
        if (p.isBestSeller) score += 20;
        if (p.rating >= 4.8) score += 12;
        score += Math.min((p.downloadsCount || 0) / 50, 20);

        return { product: p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
  }, [query, products, profile]);

  // 4. Background Debounced AI Re-Ranking (Refines relevance without blocking instant results)
  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setAiRankedResults(null);
      setIsAiRanking(false);
      return;
    }

    setIsAiRanking(true);
    const timeoutId = setTimeout(async () => {
      try {
        const topSlice = instantSearchResults.slice(0, 30);
        if (topSlice.length > 1) {
          const ranked = await rankProductsWithGemini(query, topSlice);
          setAiRankedResults(ranked);
        }
      } catch (e) {
        console.warn("AI Ranking failed, falling back to instant search", e);
      } finally {
        setIsAiRanking(false);
      }

      // Record query in history
      const trimmedQuery = query.trim();
      if (trimmedQuery.length > 2) {
        try {
          const localHistoryStr = localStorage.getItem('fm_anon_searches');
          let history: string[] = localHistoryStr ? JSON.parse(localHistoryStr) : [];
          if (!history.includes(trimmedQuery)) {
            history.unshift(trimmedQuery);
            history = history.slice(0, 10);
            localStorage.setItem('fm_anon_searches', JSON.stringify(history));
          }

          setProfile(prev => ({
            ...prev,
            searchHistory: Array.from(new Set([trimmedQuery, ...(prev.searchHistory || [])])).slice(0, 10)
          }));

          if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
              searchHistory: arrayUnion(trimmedQuery),
              updatedAt: new Date().toISOString()
            });
          }
        } catch {}
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen, currentUser, instantSearchResults]);

  // Current active base results (prefer AI ranked when ready, otherwise instant 0ms results)
  const activeBaseResults = aiRankedResults && aiRankedResults.length > 0 
    ? aiRankedResults 
    : instantSearchResults;

  // Filter by selected category chip if active
  const filteredProducts = selectedChip
    ? activeBaseResults.filter(p => p.category.toLowerCase() === selectedChip.toLowerCase())
    : activeBaseResults;

  const hasResultsInOtherCategories = selectedChip && filteredProducts.length === 0 && activeBaseResults.length > 0;

  // 5. Dynamic Trending Categories While Typing
  const dynamicTrendingCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // When empty: show top trending categories overall with their product counts
      return categoryStatsList.slice(0, 7);
    }

    // When user is typing:
    // A) Categories whose names match the query
    const directMatches = categoryStatsList.filter(c => c.name.toLowerCase().includes(q));

    // B) Categories that contain products matching the instant search results
    const matchingProductsCategoryCounts: Record<string, number> = {};
    instantSearchResults.forEach(p => {
      if (p.category) {
        matchingProductsCategoryCounts[p.category] = (matchingProductsCategoryCounts[p.category] || 0) + 1;
      }
    });

    const relatedCategories = categoryStatsList
      .filter(c => matchingProductsCategoryCounts[c.name] && !directMatches.some(dm => dm.name === c.name))
      .map(c => ({
        ...c,
        matchingCount: matchingProductsCategoryCounts[c.name]
      }))
      .sort((a, b) => (b.matchingCount || 0) - (a.matchingCount || 0));

    const combined = [
      ...directMatches.map(c => ({ ...c, matchingCount: matchingProductsCategoryCounts[c.name] || c.count })),
      ...relatedCategories
    ];

    return combined.slice(0, 6);
  }, [query, categoryStatsList, instantSearchResults]);

  // 6. Top-Performing Product Titles While Typing
  const matchingTopTitles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Empty query: Show the absolute best performing products overall
      return topPerformingProducts.slice(0, 5);
    }

    // User is typing: Find top-performing products that match the query in title, tags, or category
    const words = q.split(/\s+/).filter(Boolean);
    const matches = topPerformingProducts.filter(p => {
      const titleLower = p.title.toLowerCase();
      const catLower = (p.category || '').toLowerCase();
      const tags = (p.tags || []).map(t => t.toLowerCase());
      return (
        titleLower.includes(q) ||
        catLower.includes(q) ||
        words.some(w => titleLower.includes(w) || tags.some(t => t.includes(w)))
      );
    });

    return matches.slice(0, 5);
  }, [query, topPerformingProducts]);

  if (!isOpen) return null;

  return (
    <div 
      id="smart-search-overlay-modal" 
      className="fixed inset-0 z-[99999] flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-white min-h-screen h-full animate-in fade-in duration-200 overflow-y-auto transition-colors duration-300"
    >
      
      {/* Top Header Navigation Bar */}
      <header className="max-w-4xl w-full mx-auto p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                Instant Smart Search
              </h2>
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                0ms Live
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live trending categories, top-performing titles &amp; instant results
            </p>
          </div>
        </div>

        {/* Day/Night Theme Switch & Close Button */}
        <div className="flex items-center gap-2">
          <button
            id="search-toggle-theme-btn"
            type="button"
            onClick={toggleTheme}
            title={darkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            aria-label={darkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center shadow-xs active:scale-95"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            )}
          </button>

          <button
            id="search-close-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center justify-center shadow-xs active:scale-95"
            aria-label="Close search"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Main Search Body */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        
        {/* Large Centered Input with Live Neon Focus Glow */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="smart-search-query-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // If user types, reset category filter so they see all instant matches
              if (selectedChip && e.target.value.trim().length > 0) {
                setSelectedChip(null);
              }
            }}
            placeholder="Type 'reels bundle', 'php script', 'canva' or title..."
            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-lg pl-12 pr-24 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm dark:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all"
            autoComplete="off"
            spellCheck="false"
          />
          <div className="absolute right-3 top-3 bottom-3 flex items-center gap-1.5">
            {query && (
              <button
                id="search-clear-query-btn"
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedChip(null);
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-800 transition cursor-pointer active:scale-95"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 1. TOP-PERFORMING PRODUCT TITLES WHILE TYPING */}
        {matchingTopTitles.length > 0 && (
          <section id="search-top-performing-titles" className="space-y-2.5">
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>
                  {query.trim() ? "Top-Performing Title Matches" : "Trending & Best-Selling Assets"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {matchingTopTitles.length} items
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Click to inspect or auto-fill
              </span>
            </div>

            {/* List / Pills of Top-Performing Titles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchingTopTitles.map((prod) => (
                <div
                  key={prod.id}
                  id={`top-title-${prod.id}`}
                  className="group flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all duration-150 shadow-xs"
                >
                  {/* Left: Thumbnail & Title */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    title={`View ${prod.title}`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 relative border border-slate-200 dark:border-slate-800">
                      <img 
                        src={prod.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'} 
                        alt={prod.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {prod.isBestSeller && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                            Bestseller
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                          {prod.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <HighlightMatch text={prod.title} query={query} />
                      </h4>
                    </div>
                  </button>

                  {/* Right: Quick actions (autofill query or open) */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <span className="text-xs font-black text-slate-900 dark:text-emerald-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      ৳{prod.priceBDT}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuery(prod.title);
                        inputRef.current?.focus();
                      }}
                      title="Insert title into search"
                      aria-label="Insert title into search"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. TRENDING PRODUCT CATEGORIES WHILE TYPING */}
        {dynamicTrendingCategories.length > 0 && (
          <section id="search-trending-categories" className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {query.trim() ? "Matching Trending Categories" : "Explore Trending Categories"}
                </span>
              </div>
              {selectedChip && (
                <button 
                  type="button" 
                  onClick={() => setSelectedChip(null)} 
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Clear filter ({selectedChip})
                </button>
              )}
            </div>

            {/* Scrollable / Responsive Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {dynamicTrendingCategories.map((cat) => {
                const isSelected = selectedChip?.toLowerCase() === cat.name.toLowerCase();
                return (
                  <div key={cat.name} className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedChip(isSelected ? null : cat.name)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      <span>{cat.name}</span>
                      {cat.matchingCount !== undefined && cat.matchingCount > 0 ? (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isSelected ? 'bg-emerald-700 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {cat.matchingCount}
                        </span>
                      ) : cat.count > 0 ? (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({cat.count})
                        </span>
                      ) : null}
                    </button>

                    {/* Direct Explore Category Jump */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.name);
                        onClose();
                      }}
                      title={`Jump to full ${cat.name} category page`}
                      className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. RECENT SEARCHES (When query is empty) */}
        {!query.trim() && profile.searchHistory && profile.searchHistory.length > 0 && (
          <section id="search-recent-history" className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold px-1">
              <History className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Recent Search Queries</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.searchHistory.slice(0, 6).map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(term);
                    inputRef.current?.focus();
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80 transition cursor-pointer shadow-xs"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 4. INSTANT SEARCH RESULTS GRID */}
        <section id="search-results-section" className="space-y-3 pt-2">
          {hasResultsInOtherCategories && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in shadow-xs">
              <span>No results in <b>{selectedChip}</b>. Found {activeBaseResults.length} matching products across other categories!</span>
              <button
                type="button"
                onClick={() => setSelectedChip(null)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shrink-0 transition cursor-pointer"
              >
                Search All Categories
              </button>
            </div>
          )}

          {/* Results Summary Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {query.trim() ? "Instant Search Results" : "Curated Digital Assets"} ({filteredProducts.length})
              </span>
              {isAiRanking ? (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Gemini AI Ranking...
                </span>
              ) : query.trim() ? (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-current" />
                  Live Instant Match
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-current" />
                  Personalized For You
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Instant Cloud Delivery</span>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-12">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  id={`search-card-${product.id}`}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5 shadow-xs hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 relative border border-slate-200 dark:border-slate-800">
                    <img 
                      src={product.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-500/90 text-slate-950 text-[10px] font-black shadow-xs">
                      ৳{product.priceBDT}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 truncate">
                        {product.category}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" /> {product.rating}
                      </span>
                      {product.downloadsCount !== undefined && product.downloadsCount > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:flex items-center gap-0.5">
                          <Download className="w-2.5 h-2.5" /> {product.downloadsCount}
                        </span>
                      )}
                    </div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors truncate">
                      <HighlightMatch text={product.title} query={query} />
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {product.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center space-y-3 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  No digital assets found matching &ldquo;{query}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setSelectedChip(null);
                      inputRef.current?.focus();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Clear Search
                  </button>
                  {categoryStatsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const topCat = categoryStatsList[0]?.name;
                        if (topCat) {
                          onSelectCategory(topCat);
                          onClose();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition cursor-pointer"
                    >
                      Browse {categoryStatsList[0]?.name}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

    </div>
  );
};
