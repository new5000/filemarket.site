import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { TelegramConfig } from '../types';

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: '8293279827:AAFn12Cb-NKOHkv2rdhLjLcm8gdNkqkcKQ8',
  chatId: '5570892539',
  enabled: true
};

/**
 * Fetch Telegram configuration from Firestore `settings/global_config`
 */
export async function fetchTelegramConfig(): Promise<TelegramConfig> {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'global_config'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.telegram) {
        return {
          botToken: String(data.telegram.botToken || '').trim(),
          chatId: String(data.telegram.chatId || '').trim(),
          enabled: data.telegram.enabled !== undefined ? Boolean(data.telegram.enabled) : true,
        };
      }
    }
  } catch (err) {
    console.warn("Could not fetch telegram config from Firestore:", err);
  }

  // Fallback to local storage (support both standalone and object keys)
  try {
    const directToken = localStorage.getItem('fm_tg_botToken');
    const directChatId = localStorage.getItem('fm_tg_chatId');
    if (directToken && directChatId) {
      return {
        botToken: directToken.trim(),
        chatId: directChatId.trim(),
        enabled: true
      };
    }

    const local = localStorage.getItem('fm_telegram_config');
    if (local) return JSON.parse(local);

    const globalCfg = localStorage.getItem('fm_global_config');
    if (globalCfg) {
      const parsed = JSON.parse(globalCfg);
      if (parsed.telegram) return parsed.telegram;
    }
  } catch {}

  return DEFAULT_TELEGRAM_CONFIG;
}

/**
 * Save Telegram configuration to Firestore and local storage
 */
export async function saveTelegramConfig(config: TelegramConfig): Promise<void> {
  const cleanConfig: TelegramConfig = {
    botToken: config.botToken.trim(),
    chatId: config.chatId.trim(),
    enabled: Boolean(config.enabled)
  };

  const payload = {
    telegram: cleanConfig,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'settings', 'global_config'), payload, { merge: true });
    await setDoc(doc(db, 'settings', 'global'), payload, { merge: true });
  } catch (err) {
    console.warn("Failed to persist telegram config to Firestore:", err);
  }

  try {
    localStorage.setItem('fm_tg_botToken', cleanConfig.botToken);
    localStorage.setItem('fm_tg_chatId', cleanConfig.chatId);
    localStorage.setItem('fm_telegram_config', JSON.stringify(cleanConfig));
    const globalCfg = localStorage.getItem('fm_global_config');
    if (globalCfg) {
      const parsed = JSON.parse(globalCfg);
      parsed.telegram = cleanConfig;
      localStorage.setItem('fm_global_config', JSON.stringify(parsed));
    }
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export interface OrderAlertData {
  id: string;
  productTitle: string;
  amountBDT?: number | string;
  amountUSD?: number | string;
  paymentMethod: string;
  senderNumber?: string;
  userPhone?: string;
  userEmail?: string;
  trxId: string;
  category?: string;
  createdAt?: string;
}

/**
 * Automatically fetch the latest Chat ID that communicated with the bot via Telegram getUpdates
 */
export async function autoDetectTelegramChatId(botToken: string): Promise<string> {
  const cleanToken = botToken.trim();
  if (!cleanToken) return '';

  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getUpdates`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      // Look from the newest update backwards to find a valid chat ID
      for (let i = data.result.length - 1; i >= 0; i--) {
        const u = data.result[i];
        const cid = u.message?.chat?.id || 
                    u.channel_post?.chat?.id || 
                    u.my_chat_member?.chat?.id || 
                    u.callback_query?.message?.chat?.id;
        if (cid) {
          const stringId = String(cid);
          localStorage.setItem('fm_tg_chatId', stringId);
          return stringId;
        }
      }
    }
  } catch (err) {
    console.warn("Auto-detect chat ID network note:", err);
  }
  return localStorage.getItem('fm_tg_chatId') || '';
}

/**
 * Send an instant Telegram notification when a customer submits an order
 */
export async function sendTelegramOrderAlert(order: OrderAlertData): Promise<boolean> {
  try {
    const config = await fetchTelegramConfig();

    if (!config.enabled || !config.botToken) {
      return false;
    }

    const cleanToken = config.botToken.trim();
    if (!cleanToken) return false;

    let cleanChatId = (config.chatId || localStorage.getItem('fm_tg_chatId') || '').trim();

    // Auto-detect chat ID if not present
    if (!cleanChatId) {
      cleanChatId = await autoDetectTelegramChatId(cleanToken);
    }

    if (!cleanChatId) {
      console.warn("Telegram alert: No chat ID found. Please send /start to your bot.");
      return false;
    }

    const rawBDT = String(order.amountBDT || 0).replace(/[^0-9.]/g, '');
    const amountBDT = parseFloat(rawBDT) || 0;
    const amountUSD = order.amountUSD || Math.round(amountBDT / 120) || 0;
    const phone = order.senderNumber || order.userPhone || 'Not Specified';
    const email = order.userEmail || 'Guest Customer';
    const dateFormatted = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const messageHtml = 
`🚨 <b>NEW ORDER SUBMISSION — FileMarket</b>
━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Product:</b> ${escapeHtml(order.productTitle || 'Digital Asset')}
🏷️ <b>Category:</b> ${escapeHtml(order.category || 'Digital Assets')}
💰 <b>Amount:</b> ৳${amountBDT.toLocaleString()} BDT ($${amountUSD} USD)
💳 <b>Payment Method:</b> ${escapeHtml(order.paymentMethod || 'bKash')}
📱 <b>Sender Number:</b> <code>${escapeHtml(phone)}</code>
🔑 <b>TrxID:</b> <code>${escapeHtml(order.trxId || 'N/A')}</code>
👤 <b>Customer:</b> ${escapeHtml(email)}
🆔 <b>Order ID:</b> <code>${escapeHtml(order.id)}</code>
⏱ <b>Time (BST):</b> ${escapeHtml(dateFormatted)}
━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Action Required: Please verify payment & approve access in Admin Dashboard.</i>`;

    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: messageHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    let result = await response.json();
    if (!result.ok) {
      console.warn("Telegram alert HTML mode failed, retrying plain text:", result.description);
      // Plain text fallback
      const plainText = 
`🚨 NEW ORDER SUBMISSION — FileMarket
Product: ${order.productTitle || 'Digital Asset'}
Category: ${order.category || 'Digital Assets'}
Amount: ৳${amountBDT.toLocaleString()} BDT ($${amountUSD} USD)
Payment Method: ${order.paymentMethod || 'bKash'}
Sender: ${phone}
TrxID: ${order.trxId || 'N/A'}
Customer: ${email}
Order ID: ${order.id}
Time: ${dateFormatted}
Action Required: Please verify payment & approve in Admin Dashboard.`;

      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: plainText,
          disable_web_page_preview: true
        })
      });
      result = await response.json();
    }

    return Boolean(result.ok);
  } catch (err) {
    console.warn("Failed to dispatch Telegram order alert:", err);
    return false;
  }
}

/**
 * Send a test Telegram alert from the Admin Settings card to verify bot connectivity
 */
export async function sendTelegramTestAlert(botToken: string, chatId?: string): Promise<{ success: boolean; message: string }> {
  const cleanToken = (botToken || '').trim();
  let cleanChatId = (chatId || localStorage.getItem('fm_tg_chatId') || '').trim();

  if (!cleanToken) {
    return { success: false, message: 'Please enter a valid Telegram Bot Token.' };
  }

  if (!cleanChatId) {
    cleanChatId = await autoDetectTelegramChatId(cleanToken);
  }

  if (!cleanChatId) {
    return { 
      success: false, 
      message: '⚠️ Please open your bot in Telegram and send a "/start" message first, then click test again.' 
    };
  }

  const testMessage = 
`⚡ <b>FileMarket Alert System Test</b>
━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>Status:</b> Telegram Integration Connected Successfully!
🤖 <b>Bot Configuration:</b> Verified
💬 <b>Auto-Connected Chat ID:</b> <code>${cleanChatId}</code>
⏱ <b>Timestamp:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (BST)
━━━━━━━━━━━━━━━━━━━━━━━━
🎉 <i>Your admin Telegram notifications are now active. You will receive real-time push alerts whenever customers place orders.</i>`;

  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: testMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const resJson = await response.json();
    if (resJson.ok) {
      return { success: true, message: '✅ Test notification sent! Check your Telegram app.' };
    } else {
      const desc = resJson.description || 'Unknown error';
      let hint = desc;
      if (desc.toLowerCase().includes('chat not found')) {
        hint = `${desc} — Make sure you opened your bot in Telegram and tapped START!`;
      } else if (desc.toLowerCase().includes('unauthorized')) {
        hint = `${desc} — Please double-check your Bot Token from @BotFather.`;
      } else if (desc.toLowerCase().includes('blocked')) {
        hint = `${desc} — You blocked the bot. Please unblock and press Start in Telegram.`;
      }
      return { 
        success: false, 
        message: `❌ Telegram Error: ${hint}` 
      };
    }
  } catch (err: any) {
    return { 
      success: false, 
      message: `❌ Network error connecting to Telegram: ${err?.message || 'Please check connection.'}` 
    };
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export { sendLiveOrderAlert, notifyAdminOnTelegram } from '../utils/telegramNotify';
