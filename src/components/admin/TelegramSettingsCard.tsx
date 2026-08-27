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
    return localStorage.getItem('fm_tg_botToken') || '8293279827:AAFn12Cb-NKOHkv2rdhLjLcm8gdNkqkcKQ8';
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl shadow-slate-900/5 transition-colors duration-200">
      {/* Card Header & Live Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Send className="w-4 h-4" />
            </span>
            Telegram Live Order Alerts
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Receive instant push notifications on your phone whenever an order is submitted on FileMarket.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showGuide ? 'Hide Setup Guide' : 'Setup Guide'}
          </button>

          <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <input 
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Quick Setup Guide Drawer */}
      {showGuide && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-in fade-in duration-200">
          <div className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
            <BellRing className="w-4 h-4" /> How to connect your Telegram in 1 minute:
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            <li>Open Telegram and message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 font-bold underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
            <li>Send <code className="px-1 py-0.5 bg-sky-100 dark:bg-sky-900 rounded font-mono text-sky-800 dark:text-sky-200">/newbot</code>, choose a name and username (e.g. <code>MyFileMarketAlertBot</code>).</li>
            <li>Copy the generated <strong>API Token</strong> and paste it into the field below.</li>
            <li><strong className="text-slate-900 dark:text-white">CRITICAL:</strong> Open your newly created bot in Telegram and press <strong>START</strong> (or send <code>/start</code>) so it can deliver order alerts to you automatically.</li>
          </ol>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
            <Key className="w-3.5 h-3.5 text-slate-400" /> Telegram Bot Token
          </label>
          <input 
            type="text" 
            placeholder="8293279827:AAFn12Cb-NKOHkv2rdhLjLcm8gdNk..."
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <span>💡</span>
            <span>Tip: Open your bot in Telegram and send <strong className="text-slate-700 dark:text-slate-200">/start</strong> once so it can auto-detect your chat and deliver alerts.</span>
          </p>
        </div>

        {statusMsg && (
          <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-150 ${
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
            <span className="leading-snug">{statusMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button 
            type="button"
            onClick={handleSaveTelegram}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {isSaving ? 'Saving...' : '✓ Save Telegram Token'}
          </button>

          <button
            type="button"
            onClick={handleSendTestAlert}
            disabled={isTesting || !botToken.trim()}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5 text-sky-500" />}
            ✉ Send Test Alert
          </button>
        </div>
      </div>
    </div>
  );
}
export { TelegramSettingsCard };
