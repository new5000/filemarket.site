import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronDown, MessageSquare, Sparkles, Search, HelpCircle } from 'lucide-react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  categoryBadge: string;
  orderIndex: number;
}

export const FAQSection: React.FC = () => {
  const { globalConfig } = useGlobalSettings();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqContent = globalConfig.homeContent?.faq || {
    badge: 'FAQ & Knowledge Base',
    heading: 'Got Questions?',
    headingHighlight: "We've Got Answers",
    description: 'Everything you need to know about purchasing, accessing, and licensing digital assets from FileMarket.',
  };

  useEffect(() => {
    // Only fetch active FAQs
    const q = query(collection(db, 'faqs'), where('isActive', '==', true), orderBy('orderIndex', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched: FAQItem[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as FAQItem);
      });
      setFaqs(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.categoryBadge.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const defaultFaqs: FAQItem[] = [
    {
      id: 'default-1',
      question: "How does instant delivery work?",
      answer: "Once your payment (bKash/Nagad) is verified, our system instantly grants you view & download access via a secure Google Drive link attached directly to your FileMarket account.",
      categoryBadge: "⚡ Delivery & Access",
      orderIndex: 0
    },
    {
      id: 'default-2',
      question: "What payment methods do you accept?",
      answer: "We accept local mobile banking options including **bKash**, **Nagad**, and **Rocket**. For international or crypto payments, we accept **Binance Pay (USDT)**.",
      categoryBadge: "💳 Payment & Crypto",
      orderIndex: 1
    },
    {
      id: 'default-3',
      question: "Do I get a commercial license for digital assets?",
      answer: "Yes, all source codes, templates, and graphics come with a standard commercial license allowing you to use them in personal and client projects. Reselling the raw files directly is strictly prohibited.",
      categoryBadge: "🔒 Security & License",
      orderIndex: 2
    }
  ];

  const displayFaqs = faqs.length > 0 ? filteredFaqs : defaultFaqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.categoryBadge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  // Format basic markdown if present (bolding)
  const formatAnswer = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-slate-900 dark:text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (loading) {
    return null;
  }

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-4">
          <HelpCircle className="w-3.5 h-3.5" /> {faqContent.badge}
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white font-heading tracking-tight mb-3">
          {faqContent.heading} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">{faqContent.headingHighlight}</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          {faqContent.description}
        </p>
      </div>

      <div className="relative mb-8 max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search questions or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-medium text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-3">
        {displayFaqs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No questions found matching "{searchQuery}"</p>
          </div>
        ) : (
          displayFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div 
                key={faq.id} 
                className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/30 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
                    : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 hover:border-emerald-500/30'
                }`}
              >
                <button
                  onClick={() => toggleOpen(faq.id)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer focus:outline-none"
                >
                  <div className="flex-1 pr-4">
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                        <Sparkles className="w-3 h-3" /> {faq.categoryBadge}
                      </span>
                    </div>
                    <h3 className={`font-bold text-sm sm:text-base leading-snug transition-colors duration-200 ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400'}`}>
                      {faq.question}
                    </h3>
                  </div>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="p-5 sm:p-6 pt-0 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-emerald prose-p:leading-relaxed">
                        {formatAnswer(faq.answer)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
