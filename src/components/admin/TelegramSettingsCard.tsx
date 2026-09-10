import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Send, CheckCircle2, AlertCircle, HelpCircle, BellRing, Key, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { saveTelegramConfig, sendTelegramTestAlert, autoDetectTelegramChatId } from '../../lib/telegramService';

interface TelegramSettingsCardProps {
  onSaved?: () => void;
}

export default function TelegramSettingsCard({ onSaved }: TelegramSettingsCardProps) {
  // Controlled state for Telegram Bot Token with local cache initialization
  const [botToken, setBotToken] = useState<string>(() => {
    return localStorage.getItem('fm_tg_botToken') || '';
  });
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // 1. Fetch saved Bot Token & real-time sync from Firestore
  useEffect(() => {
    let isMounted = true;

    // Initial load from Firestore settings/global_config
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'global_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().telegram) {
          const { botToken: token, enabled } = docSnap.data().telegram;
          if (isMounted) {
            if (token) {
              setBotToken(token);
              localStorage.setItem('fm_tg_botToken', token);
            }
            if (enabled !== undefined) {
              setIsEnabled(Boolean(enabled));
            }
          }
        }
      } catch (err) {
        console.warn('Firestore fetch note, using local cache:', err);
      }
    };
    fetchConfig();

    // Attach real-time snapshot listener
    const configRef = doc(db, 'settings', 'global_config');
    const unsub = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists() && isMounted) {
        const data = docSnap.data();
        if (data && data.telegram?.botToken) {
          const token = data.telegram.botToken;
          setBotToken(token);
          localStorage.setItem('fm_tg_botToken', token);
          if (data.telegram.enabled !== undefined) {
            setIsEnabled(Boolean(data.telegram.enabled));
          }
        }
      }
    }, (err) => {
      console.warn("Real-time telegram settings listener notice:", err);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // 2. Save Bot Token (Only Bot Token Required)
  const handleSaveTelegram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!botToken.trim()) {
      setStatusMsg({ type: 'error', text: '❌ Please enter your Telegram Bot Token.' });
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);
    const cleanToken = botToken.trim();

    // Instant local save
    localStorage.setItem('fm_tg_botToken', cleanToken);

    try {
      // Auto-detect Chat ID from Telegram getUpdates in background
      let detectedChatId = localStorage.getItem('fm_tg_chatId') || '';
      try {
        const autoChat = await autoDetectTelegramChatId(cleanToken);
        if (autoChat) {
          detectedChatId = autoChat;
        }
      } catch (err) {
        console.warn('Auto-detect chat ID note:', err);
      }

      // Save directly to Firestore settings/global_config
      const configRef = doc(db, 'settings', 'global_config');
      await setDoc(configRef, {
        telegram: {
          botToken: cleanToken,
          chatId: detectedChatId,
          enabled: isEnabled,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });

      // Redundant helper cache
      await saveTelegramConfig({
        botToken: cleanToken,
        chatId: detectedChatId,
        enabled: isEnabled
      });

      setStatusMsg({ 
        type: 'success', 
        text: detectedChatId 
          ? `✅ Telegram Bot Token saved & connected to Chat ID (${detectedChatId})!` 
          : '✅ Telegram Bot Token saved successfully!' 
      });
      if (onSaved) onSaved();
    } catch (error: any) {
      console.error('Firestore save failed:', error);
      setStatusMsg({ type: 'info', text: '✅ Saved locally! (Firebase remote sync pending)' });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setStatusMsg(null);
      }, 5000);
    }
  };

  // 3. Send Test Alert (Auto-resolves Chat ID if needed)
  const handleSendTestAlert = async () => {
    const cleanToken = botToken.trim() || localStorage.getItem('fm_tg_botToken') || '';
    if (!cleanToken) {
      setStatusMsg({ type: 'error', text: '❌ Please enter and save your Bot Token first.' });
      return;
    }

    setIsTesting(true);
    setStatusMsg({ type: 'info', text: '🔄 Fetching chat & sending test alert...' });

    try {
      // 1. Fetch latest chat ID via auto-detect if not stored
      let targetChatId = localStorage.getItem('fm_tg_chatId') || '';
      try {
        const updateRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates`);
        const updateData = await updateRes.json();
        
        if (updateData.ok && Array.isArray(updateData.result) && updateData.result.length > 0) {
          for (let i = updateData.result.length - 1; i >= 0; i--) {
            const u = updateData.result[i];
            const cid = u.message?.chat?.id || u.channel_post?.chat?.id || u.my_chat_member?.chat?.id;
            if (cid) {
              targetChatId = String(cid);
              localStorage.setItem('fm_tg_chatId', targetChatId);
              break;
            }
          }
        }
      } catch (e) {
        console.warn("getUpdates error:", e);
      }

      if (!targetChatId) {
        setIsTesting(false);
        setStatusMsg({ 
          type: 'error', 
          text: '⚠️ Please open your bot in Telegram and send a "/start" message first, then click test again.' 
        });
        return;
      }

      // 2. Dispatch test message via service
      const testResult = await sendTelegramTestAlert(cleanToken, targetChatId);
      if (testResult.success) {
        setStatusMsg({ type: 'success', text: '🚀 Test alert sent! Check your Telegram app.' });
      } else {
        setStatusMsg({ type: 'error', text: testResult.message });
      }
    } catch (err: any) {
      console.error('Test alert error:', err);
      setStatusMsg({ type: 'error', text: '❌ Failed to reach Telegram API. Please check your internet.' });
    } finally {
      setIsTesting(false);
      setTimeout(() => {
        setStatusMsg(null);
      }, 7000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 rounded-2xl space-y-4 shadow-xl shadow-slate-900/5">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-500">
              <Send className="w-4 h-4" />
            </span>
            <span>Telegram Order Alerts</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showGuide ? 'Hide Guide' : 'Setup Guide'}</span>
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <input 
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {isEnabled ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>
      </div>

      {/* Quick Setup Guide Drawer */}
      {showGuide && (
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
          <div className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1 text-[11px]">
            <BellRing className="w-3.5 h-3.5" /> Quick Telegram Setup:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
            <li>Open Telegram and message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-2.5 h-2.5" /></a></li>
            <li>Send <code className="px-1 py-0.2 bg-sky-100 dark:bg-sky-900 rounded font-mono">/newbot</code> to get your API Token</li>
            <li>Paste the token below, then send <code className="px-1 py-0.2 bg-sky-100 dark:bg-sky-900 rounded font-mono">/start</code> to your bot</li>
          </ol>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span>Bot Token</span>
          </label>
          <input 
            type="text" 
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {statusMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
              : statusMsg.type === 'info'
              ? 'bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : statusMsg.type === 'info' ? (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="leading-snug text-[11px]">{statusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:flex items-center gap-2 pt-1">
          <button 
            type="button"
            onClick={handleSaveTelegram}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save Token'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendTestAlert}
            disabled={isTesting || !botToken.trim()}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 border border-slate-200 dark:border-slate-700"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5 text-sky-500" />}
            <span>Test Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export { TelegramSettingsCard };
