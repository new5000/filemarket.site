import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Save, Trash2, Edit3, X, ExternalLink, Globe, LayoutTemplate, FileText } from 'lucide-react';

export interface CustomPageData {
  id: string; // slug
  title: string;
  content: string;
  updatedAt: number;
}

export const AdminCustomPagesEditor: React.FC = () => {
  const [pages, setPages] = useState<CustomPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'custom_pages'), (snap) => {
      const data: CustomPageData[] = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as CustomPageData));
      setPages(data.sort((a, b) => b.updatedAt - a.updatedAt));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormSlug('');
    setFormTitle('');
    setFormContent('<div class="prose max-w-none dark:prose-invert">\n  <h1>Your Title Here</h1>\n  <p>Start writing your page content here...</p>\n</div>');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (page: CustomPageData) => {
    setEditingId(page.id);
    setFormSlug(page.id);
    setFormTitle(page.title);
    setFormContent(page.content);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSlug.trim() || !formContent.trim()) {
      setError('All fields are required.');
      return;
    }
    const cleanSlug = formSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    
    if (!editingId && pages.some(p => p.id === cleanSlug)) {
      setError('A page with this URL slug already exists.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await setDoc(doc(db, 'custom_pages', editingId || cleanSlug), {
        title: formTitle,
        content: formContent,
        updatedAt: Date.now()
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom page?')) return;
    try {
      await deleteDoc(doc(db, 'custom_pages', id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete page.');
    }
  };

  const applyFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    const newContent = before + prefix + selected + suffix + after;
    setFormContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-emerald-500" />
            Custom Pages & Legal CMS
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build standalone dynamic pages (e.g. /page/about-us, /page/terms) using the rich text HTML builder.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Create New Page
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-500">Loading custom pages...</div>
      ) : pages.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
          <FileText className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Custom Pages Found</p>
          <p className="text-xs text-slate-500 mt-1">Create your first custom privacy policy or about page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map(page => (
            <div key={page.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{page.title}</h4>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md">
                    /page/{page.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 opacity-70">
                  {page.content.replace(/<[^>]+>/g, '').substring(0, 100)}...
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a 
                  href={`/page/${page.id}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> View Live
                </a>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(page)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(page.id)} className="p-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                {editingId ? 'Edit Custom Page' : 'Create Custom Page'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full text-slate-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-xl">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Page Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Privacy Policy 2026"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Slug *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">/page/</span>
                    <input
                      type="text"
                      required
                      disabled={!!editingId} // slug cannot be changed once created
                      value={formSlug}
                      onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="e.g. privacy-policy"
                      className={`w-full pl-14 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none ${editingId ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex-1 flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Rich HTML Content Builder *</label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => applyFormat('<strong>', '</strong>')} className="px-2 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">Bold</button>
                    <button type="button" onClick={() => applyFormat('<em>', '</em>')} className="px-2 py-1 text-xs italic bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">Italic</button>
                    <button type="button" onClick={() => applyFormat('<h2>', '</h2>')} className="px-2 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">H2</button>
                    <button type="button" onClick={() => applyFormat('<ul>\n  <li>', '</li>\n</ul>')} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">List</button>
                    <button type="button" onClick={() => applyFormat('<a href="URL" class="text-emerald-500 hover:underline">', '</a>')} className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">Link</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[400px]">
                  {/* Editor */}
                  <textarea
                    id="rich-text-editor"
                    required
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    className="w-full h-full min-h-[400px] p-4 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c1425] text-slate-800 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none leading-relaxed"
                    placeholder="Enter valid HTML or plain text here..."
                  />
                  {/* Live Preview */}
                  <div className="w-full h-full min-h-[400px] p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1425] overflow-y-auto shadow-inner">
                    <h1 className="text-2xl font-black mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">{formTitle || 'Live Preview'}</h1>
                    <div 
                      className="prose prose-sm sm:prose-base dark:prose-invert prose-emerald max-w-none"
                      dangerouslySetInnerHTML={{ __html: formContent || '<p class="text-slate-400">Start typing to see live preview...</p>' }}
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Publishing...' : 'Publish Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
