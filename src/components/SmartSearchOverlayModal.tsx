import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Tag, ArrowRight, Star, Loader2, Sparkles, History } from 'lucide-react';
import { Product } from '../types';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { db, getUserProfileFromFirestore } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { rankProductsWithGemini, scoreProductRelevance, AIUserProfile } from '../utils/aiRecommender';

interface SmartSearchOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: string) => void;
}

export const SmartSearchOverlayModal: React.FC<SmartSearchOverlayModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onSelectCategory,
}) => {
  const { products } = useProducts();
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

      // Pre-rank products based on user profile (Personalized for you on open)
      const scored = [...products].sort((a, b) => {
        return scoreProductRelevance(b, loadedProfile) - scoreProductRelevance(a, loadedProfile);
      });
      setResults(scored);
    };

    loadProfile();
  }, [isOpen, currentUser, products]);

  // Handle live search matching and AI ranking
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      // Re-score/pre-rank according to profile when query is empty
      const scored = [...products].sort((a, b) => {
        return scoreProductRelevance(b, profile) - scoreProductRelevance(a, profile);
      });
      setResults(scored);
      setIsSearching(false);
      setIsAiRanking(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      const filtered = products.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      );

      setIsAiRanking(true);
      // Run our Google Gemini / local rank match utility
      const ranked = await rankProductsWithGemini(query, filtered);
      setResults(ranked);
      setIsAiRanking(false);
      setIsSearching(false);

      // Record query to profile history (debounced)
      const trimmedQuery = query.trim();
      if (trimmedQuery.length > 2) {
        try {
          // Local storage first
          const localHistoryStr = localStorage.getItem('fm_anon_searches');
          let history: string[] = localHistoryStr ? JSON.parse(localHistoryStr) : [];
          if (!history.includes(trimmedQuery)) {
            history.unshift(trimmedQuery);
            history = history.slice(0, 10);
            localStorage.setItem('fm_anon_searches', JSON.stringify(history));
          }

          setProfile(prev => {
            const updatedHistory = Array.from(new Set([trimmedQuery, ...(prev.searchHistory || [])])).slice(0, 10);
            return { ...prev, searchHistory: updatedHistory };
          });

          // Firestore write if authenticated
          if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
              searchHistory: arrayUnion(trimmedQuery),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn("Failed to save search history:", err);
        }
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query, isOpen, products, currentUser]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setSelectedChip(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = selectedChip 
    ? results.filter(p => p.category === selectedChip)
    : results;

  const hasResultsInOtherCategories = selectedChip && filteredProducts.length === 0 && results.length > 0;

  const chips = ['Video Bundles', 'Online Courses', 'E-Books', 'Premium Apps', 'AI Prompts', 'PHP Scripts', 'Blogger Templates'];

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-[#0B1120] min-h-screen h-full animate-in fade-in duration-200 overflow-y-auto">
      
      {/* Top Header Bar */}
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-white text-base sm:text-lg">Smart Search &amp; Discovery</h2>
            <p className="text-xs text-slate-400">AI-powered match for instant digital product retrieval</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Search Body */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 flex-1">
        
        {/* Large Centered Input with Emerald Neon Glow */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-emerald-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type 'reel templates', 'saas script' or what you want to build..."
            className="w-full bg-slate-900/90 text-white placeholder-slate-400 text-base sm:text-lg pl-12 pr-20 py-4 rounded-2xl border border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all"
          />
          <div className="absolute right-3 top-3 bottom-3 flex items-center gap-1.5">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Recent Searches (Intent History) */}
        {profile.searchHistory && profile.searchHistory.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Queries</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.searchHistory.slice(0, 5).map((term, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(term)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Chips (Filtering) directly underneath Search Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Filter by Category</span>
            {selectedChip && (
              <button onClick={() => setSelectedChip(null)} className="text-emerald-400 hover:underline cursor-pointer">
                Reset filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {chips.map((chip) => {
              const isSelected = selectedChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setSelectedChip(isSelected ? null : chip)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                       ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                       : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results Grid immediately below category chips */}
        <div className="space-y-3 pt-2">
          {hasResultsInOtherCategories && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in shadow-sm">
              <span>No results in <b>{selectedChip}</b>. Found {results.length} matching products across other categories!</span>
              <button
                onClick={() => setSelectedChip(null)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shrink-0 transition cursor-pointer"
              >
                Search in All Categories?
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <span>Matching Assets ({filteredProducts.length})</span>
              {isAiRanking ? (
                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Gemini AI Ranking...
                </span>
              ) : !query.trim() && results.length > 0 ? (
                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-fade">
                  <Sparkles className="w-3 h-3 text-emerald-400 fill-current" />
                  AI Personalized Recommendations
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 text-emerald-400 fill-current" />
                  AI Smart Ranked Match
                </span>
              )}
            </div>
            <span>Instant Checkout</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-12">
            {isSearching ? (
              // Skeleton Loader
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5 animate-pulse">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="h-3 w-16 bg-slate-800 rounded"></div>
                      <div className="h-3 w-8 bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="group p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex items-center gap-3.5 shadow-sm hover:shadow-lg"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative">
                    <img src={product.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-emerald-500/90 text-slate-950 text-[9px] font-black">
                      ৳{product.priceBDT}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 truncate">
                        {product.category}
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" /> {product.rating}
                      </span>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                      {product.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{product.description}</p>
                  </div>
                  <div className="shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm">No digital assets found matching &ldquo;{query}&rdquo;</p>
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedChip(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
