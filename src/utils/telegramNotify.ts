/**
 * Direct guaranteed Telegram notification dispatcher
 */

export interface OrderInfoPayload {
  productTitle?: string;
  amount?: number | string;
  amountBDT?: number | string;
  amountUSD?: number | string;
  paymentMethod?: string;
  trxId?: string;
  senderNumber?: string;
  userPhone?: string;
  userEmail?: string;
  orderId?: string;
  id?: string;
  createdAt?: string;
}

export const notifyAdminOnTelegram = async (orderInfo: OrderInfoPayload): Promise<boolean> => {
  const BOT_TOKEN = "8293279827:AAFn12Cb-NKOHkv2rdhLjLcm8gdNkqkcKQ8";
  const CHAT_ID = "5570892539";

  const productTitle = orderInfo.productTitle || 'Digital Product';
  const rawAmt = orderInfo.amount ?? orderInfo.amountBDT ?? 0;
  const amount = typeof rawAmt === 'number' ? rawAmt.toLocaleString() : String(rawAmt);
  const paymentMethod = orderInfo.paymentMethod || 'bKash';
  const trxId = orderInfo.trxId || 'N/A';
  const senderNumber = orderInfo.senderNumber || orderInfo.userPhone || 'N/A';
  const userEmail = orderInfo.userEmail || 'Guest';
  const orderId = orderInfo.orderId || orderInfo.id || 'N/A';
  const timeString = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const messageText = 
`🚨 *NEW ORDER PLACED!* 🚨
━━━━━━━━━━━━━━━━━━━━━
📦 *Product:* ${productTitle}
💰 *Amount:* ৳${amount} BDT
💳 *Gateway:* ${paymentMethod}
🔢 *TrxID:* \`${trxId}\`
📱 *Sender No:* \`${senderNumber}\`
👤 *User:* ${userEmail}
🆔 *Ref:* \`${orderId}\`
⏰ *Time:* ${timeString} (BST)
━━━━━━━━━━━━━━━━━━━━━
👉 *Check Admin Panel to verify & approve!*`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    
    const result = await response.json();
    console.log("Telegram alert response:", result);

    if (result.ok) {
      return true;
    }

    // Fallback if Markdown entity parsing failed due to special characters in title/email
    console.warn("Markdown Telegram alert rejected by API, attempting plain text fallback:", result.description);
    const plainText = 
`🚨 NEW ORDER PLACED! 🚨
━━━━━━━━━━━━━━━━━━━━━
📦 Product: ${productTitle}
💰 Amount: ৳${amount} BDT
💳 Gateway: ${paymentMethod}
🔢 TrxID: ${trxId}
📱 Sender No: ${senderNumber}
👤 User: ${userEmail}
🆔 Ref: ${orderId}
⏰ Time: ${timeString} (BST)
━━━━━━━━━━━━━━━━━━━━━
👉 Check Admin Panel to verify & approve!`;

    const fallbackResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: plainText,
        disable_web_page_preview: true
      })
    });
    const fallbackResult = await fallbackResponse.json();
    console.log("Plaintext Telegram alert fallback response:", fallbackResult);
    return Boolean(fallbackResult.ok);
  } catch (err) {
    console.error("Critical Telegram Alert Error:", err);
    return false;
  }
};

export const sendLiveOrderAlert = notifyAdminOnTelegram;
