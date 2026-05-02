const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramAlert(message: string) {
    console.log('TOKEN:', TOKEN ? 'found' : 'MISSING');
    console.log('CHAT_ID:', CHAT_ID ? 'found' : 'MISSING');
  if (!TOKEN || !CHAT_ID) return;
  try {
    const url = "https://api.telegram.org/bot" + TOKEN + "/sendMessage";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const result = await res.json();
    console.log('TG:', JSON.stringify(result));
  } catch (e) {
    console.error("Telegram error:", e);
  }
}

export function formatAlert(token: any): string {
  const dot = String.fromCharCode(46);
  const bagsUrl = "https://bags" + dot + "fm/token/" + token.mint;
  const tagEmoji: Record<string, string> = {
    "Breakout": "⚡",
    "Fake Hype": "⚠",
    "Stealth Gem": "💎",
  };
  const emoji = tagEmoji[token.tag] || "📡";
  return [
    emoji + " <b>" + token.tag + "</b> — " + token.symbol,
    "",
    "Potential Score: <b>" + token.potentialScore + "</b>",
    "  Attention: " + token.attentionScore,
    "  Conversion: " + token.conversionScore,
    "  Momentum: " + token.momentumScore,
    "",
    "Fees: " + token.lifetimeFeesSol.toFixed(4) + " SOL",
    "Risk: " + token.riskScore + "/100",
    "",
    "<a href=\"" + bagsUrl + "\">Trade on Bags.fm</a>",
  ].join("\n");
}