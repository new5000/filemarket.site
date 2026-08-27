import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileText, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface CustomPageViewProps {
  slug: string;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({ slug }) => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const d = await getDoc(doc(db, 'custom_pages', slug));
        if (d.exists()) {
          setContent(d.data());
          document.title = `${d.data().title} - FileMarket`;
        } else {
          setContent(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchPage();
      window.scrollTo(0, 0);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-12 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Page Not Found</h1>
        <p className="text-slate-500 mt-2">The custom page you are looking for does not exist.</p>
        <a href="/" className="mt-6 inline-block bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-600 transition">
          Return Home
        </a>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <a href="/" className="hover:text-emerald-500 transition">Home</a>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-slate-200">{content.title}</span>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
          {content.title}
        </h1>
        
        <div 
          className="prose prose-sm sm:prose-base dark:prose-invert prose-emerald max-w-none prose-headings:font-black prose-a:text-emerald-500 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      </div>
    </motion.div>
  );
};
