/**
 * Deep Bilingual (Bangla + English + Banglish) SEO Keyword Generator for FileMarket
 * Generates an extensive 2,000 to 5,000 character keyword cluster spanning 6 core intent categories:
 * 1. Core Asset & Title Variations
 * 2. High-Intent Bangla Searches (বাংলা সার্চ কিওয়ার্ড)
 * 3. High-Intent Banglish Queries (বাংলিশ সার্চ ইনটেন্ট)
 * 4. Long-Tail Question Phrases (Google & YouTube Search Suggestions)
 * 5. Software Compatibility, Ecosystem & File Formats
 * 6. Commercial & Transactional Intent Keywords (bKash/Nagad/Instant Access)
 */

export interface SeoKeywordClusterResult {
  keywordsList: string[];
  keywordsString: string;
  totalChars: number;
  totalTags: number;
}

export function generateMassiveSeoKeywords(
  title: string = '',
  category: string = 'Video Bundles',
  description: string = ''
): string {
  const result = generateSeoKeywordCluster(title, category, description);
  return result.keywordsString;
}

export function generateSeoKeywordCluster(
  title: string = '',
  category: string = 'Video Bundles',
  description: string = ''
): SeoKeywordClusterResult {
  const cleanTitle = (title || 'Digital Asset').trim();
  const cleanCategory = (category || 'Video Bundles').trim();
  const lowerTitle = cleanTitle.toLowerCase();
  const tagsSet = new Set<string>();

  // Extract core tokens
  const titleTokens = lowerTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['and', 'the', 'for', 'with', 'your', 'this', 'that', 'from', 'best', 'super', 'mega', 'pack'].includes(w));

  // --- 1. CORE ASSET & TITLE VARIATIONS ---
  tagsSet.add(lowerTitle);
  tagsSet.add(`${cleanTitle} download`);
  tagsSet.add(`${cleanTitle} bangladesh`);
  tagsSet.add(`${cleanTitle} official files`);
  tagsSet.add(`${cleanTitle} full version`);
  tagsSet.add(`${cleanTitle} lifetime access`);
  tagsSet.add(`${cleanTitle} google drive link`);
  tagsSet.add(`${cleanTitle} instant access`);
  tagsSet.add(`${cleanTitle} original source code`);
  tagsSet.add(`${cleanTitle} updated 2026`);
  tagsSet.add(`${cleanTitle} digital download`);
  tagsSet.add(`${cleanTitle} pack 4k`);
  tagsSet.add(`${cleanTitle} premium bundle`);
  tagsSet.add(`${cleanTitle} high speed drive`);

  titleTokens.forEach(token => {
    tagsSet.add(token);
    tagsSet.add(`${token} pack`);
    tagsSet.add(`${token} bundle`);
    tagsSet.add(`${token} assets`);
    tagsSet.add(`${token} toolkit 2026`);
    tagsSet.add(`${token} tutorial`);
  });

  for (let i = 0; i < titleTokens.length - 1; i++) {
    tagsSet.add(`${titleTokens[i]} ${titleTokens[i+1]}`);
    tagsSet.add(`${titleTokens[i]} ${titleTokens[i+1]} pack`);
    tagsSet.add(`${titleTokens[i]} ${titleTokens[i+1]} download`);
    tagsSet.add(`${titleTokens[i]} ${titleTokens[i+1]} bangladesh`);
  }

  // --- 2. HIGH-INTENT BANGLA SEARCHES (বাংলা সার্চ কিওয়ার্ড) ---
  const banglaBase = [
    `${cleanTitle} ডাউনলোড`,
    `${cleanTitle} কীভাবে ডাউনলোড করবেন`,
    `সেরা ${cleanCategory} প্যাক বাংলাদেশ`,
    `কম দামে ${cleanTitle} কিনুন`,
    `বিকাশ পেমেন্ট ফাইল ডাউনলোড`,
    `নগদ পেমেন্ট দিয়ে ${cleanTitle} ডাউনলোড`,
    `রকেট পেমেন্ট ডিজিটাল প্রোডাক্ট`,
    `গুগল ড্রাইভ হাই স্পিড লিংক`,
    `১০০% অরিজিনাল ভেরিফাইড ফাইল`,
    `লাইফটাইম আনলিমিটেড এক্সেস`,
    `ভাইরাল কনটেন্ট ক্রিয়েশন মেটেরিয়াল ২০২৬`,
    `ভিডিও এডিটিং রিসোর্স বাংলাদেশ`,
    `প্রফেশনাল ডেভেলপার সোর্স কোড`,
    `ফাইলমার্কেট ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস`,
    `সবচেয়ে কম মূল্যে ডিজিটাল সম্পদ`,
    `ইনস্ট্যান্ট ডাউনলোড গুগল ড্রাইভ`,
    `ফ্রিল্যান্সারদের জন্য সেরা টুলকিট`,
    `ইউটিউব কনটেন্ট ক্রিয়েটর বান্ডেল`,
    `ফেসবুক রিলস ভিডিও টেমপ্লেট`,
    `ফুল কোর্স বাংলা ভিডিও টিউটোরিয়াল`,
    `এক ক্লিকে ড্রাইভ ফাইল অ্যাক্সেস`,
    `কোন পাসওয়ার্ড বা ঝামেলা ছাড়া ডাউনলোড`,
    `সেরা রেটেড ডিজিটাল প্রোডাক্টস বাংলাদেশ`
  ];
  banglaBase.forEach(b => tagsSet.add(b));

  // --- 3. HIGH-INTENT BANGLISH QUERIES (বাংলিশ সার্চ ইনটেন্ট) ---
  const banglishBase = [
    `${lowerTitle} download bd`,
    `${lowerTitle} kivabe kinbo`,
    `kom dame ${lowerTitle}`,
    `kom dame ${cleanCategory} bangladesh`,
    `best digital asset store bd`,
    `bkash payment instant drive access`,
    `nagad accepted digital store bd`,
    `filemarket verified asset download`,
    `lifetime commercial license pack`,
    `direct google drive unlock link`,
    `bangladesh software marketplace online`,
    `shobar cheye kom dame original files`,
    `digital product kinun bKash diye`,
    `fast google drive cloud download link`,
    `freelancing video editing toolkit bd`,
    `bangla full course google drive link`,
    `premiere pro after effects template bd`,
    `capcut viral transition pack download`,
    `no virus 100 percent working files`
  ];
  banglishBase.forEach(bg => tagsSet.add(bg));

  // --- 4. LONG-TAIL QUESTION PHRASES (Google, YouTube & Facebook Suggest) ---
  const longTailQuestions = [
    `how to download ${lowerTitle} in bangladesh`,
    `where to buy ${lowerTitle} with bkash`,
    `best ${cleanCategory} bundle for content creators 2026`,
    `how to get instant google drive access for ${lowerTitle}`,
    `step by step tutorial for ${lowerTitle}`,
    `is ${lowerTitle} safe and verified`,
    `best affordable digital marketplace in bangladesh`,
    `how to edit videos fast using ${cleanTitle}`,
    `best motion graphics and sound effects bundle 2026`,
    `how to install ${cleanTitle} easily on pc and mac`,
    `where to find original ${cleanTitle} source files`
  ];
  longTailQuestions.forEach(q => tagsSet.add(q));

  // --- 5. CATEGORY-SPECIFIC, COMPATIBILITY & ECOSYSTEM KEYWORDS ---
  const cat = cleanCategory.toLowerCase();
  if (cat.includes('video') || lowerTitle.includes('video') || lowerTitle.includes('lut') || lowerTitle.includes('capcut') || lowerTitle.includes('transition')) {
    [
      'cinematic color grading luts 4k', 'adobe premiere pro 2024 2025 2026 mogrt', 'after effects cc project templates',
      'capcut viral video transition pack', 'vn video editor mobile transitions', 'davinci resolve studio powergrades',
      'final cut pro x plugins pack', 'youtube elements lower thirds pack', 'instagram viral reels hooks and background',
      '4k cinematic video overlays and light leaks', 'studio grade sound effects sfx pack', 'whoosh transition audio fx',
      'glitch visual effects and film grain textures', 'green screen visual fx library', 'b-roll 4k stock footage pack',
      'motion graphics animated callouts', 'social media video kit 2026', 'bangla video editing masterclass'
    ].forEach(k => tagsSet.add(k));
  } else if (cat.includes('course') || lowerTitle.includes('course') || lowerTitle.includes('learn') || lowerTitle.includes('masterclass')) {
    [
      'complete online masterclass bangla', 'step by step video training modules', 'freelancing masterclass blueprint',
      'digital marketing full course bangla', 'web development full stack tutorial', 'graphic design video training',
      'fiverr upwork success case studies', 'beginner to advanced video lectures', 'e-learning resource bangladesh',
      'high resolution video training drive link', 'lifetime course access google drive', 'freelancing career blueprint'
    ].forEach(k => tagsSet.add(k));
  } else if (cat.includes('ebook') || cat.includes('e-book') || lowerTitle.includes('book') || lowerTitle.includes('pdf')) {
    [
      'ebook pdf bangla download', 'actionable business guide pdf', 'digital marketing strategy handbook',
      'freelancing success blueprint pdf', 'printable checklist and workbook', 'high resolution pdf epub reader',
      'best selling bangla ebook online', 'instant pdf download drive link', 'entrepreneurship strategy handbook'
    ].forEach(k => tagsSet.add(k));
  } else if (cat.includes('app') || cat.includes('software') || lowerTitle.includes('software') || lowerTitle.includes('pc')) {
    [
      'premium pc software full activated', 'lifetime license software windows 11 10', 'macos premium utilities software',
      'android mod apk unlocked features', 'pre-activated software installer one click', '100 percent virus scanned verified',
      'no recurring subscription tools', 'essential pc utilities 2026', 'fast server google drive link download'
    ].forEach(k => tagsSet.add(k));
  } else if (cat.includes('prompt') || lowerTitle.includes('prompt') || lowerTitle.includes('chatgpt') || lowerTitle.includes('midjourney')) {
    [
      'chatgpt mega prompt library 2026', 'midjourney v6 realistic photo prompts', 'ai image generation formulas copy paste',
      'claude ai copywriting prompts', 'stable diffusion master prompt list', 'high converting marketing prompts',
      'seo article generator prompts', 'e-commerce copywriting ai prompts', 'prompt engineering cheatsheet'
    ].forEach(k => tagsSet.add(k));
  } else if (cat.includes('script') || lowerTitle.includes('script') || lowerTitle.includes('source code') || lowerTitle.includes('codecanyon')) {
    [
      'full php source code script download', 'laravel web application source code', 'codecanyon clone script mysql',
      'responsive modern admin panel dashboard', 'saas platform php script 2026', 'rest api backend integration',
      'ecommerce multi vendor source code', 'commercial license unlimited domains', 'one click database sql installation'
    ].forEach(k => tagsSet.add(k));
  } else if (cat.includes('blogger') || lowerTitle.includes('blogger') || lowerTitle.includes('theme') || lowerTitle.includes('template')) {
    [
      'blogger template xml theme download', 'blogspot theme google adsense ready', 'seo friendly responsive blogger template',
      'core web vitals 99 fast loading theme', 'news magazine blogger theme xml', 'affiliate marketing blogspot template',
      'clean schema markup blogger code', 'mobile friendly fast blogspot theme'
    ].forEach(k => tagsSet.add(k));
  } else if (cat.includes('service') || lowerTitle.includes('service')) {
    [
      'custom wordpress setup service', 'php script server installation support', 'cpanel hosting migration service',
      'page speed optimization 90 plus', 'seo audit and technical bug fixes', '24 to 48 hours fast service delivery'
    ].forEach(k => tagsSet.add(k));
  }

  // --- 6. COMMERCIAL, TRANSACTIONAL & BRAND CLUSTERS ---
  const commercialIntents = [
    `buy ${cleanTitle} online`,
    `download ${cleanTitle} instant access`,
    `verified ${cleanCategory} bundle 2026`,
    `best ${cleanCategory} for bangladeshi creators`,
    `commercial lifetime license included`,
    `high speed google drive cloud locker`,
    `professional ${cleanTitle} source files`,
    `complete bundle with quick start guide`,
    `virus free 100% tested digital assets`,
    `filemarket exclusive digital marketplace`,
    `bKash verified payment gateway`,
    `Nagad instant checkout discount`,
    `Rocket fast payment processing`,
    `24/7 fast customer support bangladesh`,
    `official digital files high speed download`,
    `cheap price digital assets store bd`,
    `instant access link delivered automatically`,
    `trusted digital asset seller in bangladesh`
  ];
  commercialIntents.forEach(ci => tagsSet.add(ci));

  // Combinatorial multipliers to guarantee 2,000–5,000 chars of high density
  const primaryKeys = Array.from(tagsSet);
  primaryKeys.forEach(key => {
    if (key.length < 35) {
      tagsSet.add(`best ${key}`);
      tagsSet.add(`2026 ${key}`);
      tagsSet.add(`${key} drive link`);
    }
  });

  const finalArray = Array.from(tagsSet).filter(Boolean);
  const finalString = finalArray.join(', ');

  return {
    keywordsList: finalArray,
    keywordsString: finalString,
    totalChars: finalString.length,
    totalTags: finalArray.length
  };
}
