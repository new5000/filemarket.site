import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

export interface AIUserProfile {
  searchHistory?: string[];
  viewedCategories?: Record<string, number>;
  viewedTags?: string[];
}

/**
 * Client-Side Semantic & Keyword Scoring Utility
 * Ranks a single product's relevance score based on user profile (recent category views, searched terms, tags)
 */
export function scoreProductRelevance(product: Product, userProfile: AIUserProfile): number {
  let score = 0;
  
  const searchTerms = (userProfile.searchHistory || []).join(' ').toLowerCase();
  const viewedCategories = userProfile.viewedCategories || {};
  const viewedTags = userProfile.viewedTags || [];

  const productText = `${product.title} ${product.category} ${product.description || ''} ${(product.tags || []).join(' ')}`.toLowerCase();

  // 1. Category frequency weight
  if (viewedCategories[product.category]) {
    score += viewedCategories[product.category] * 3;
  }

  // 2. Tag & Keyword matching
  viewedTags.forEach(tag => {
    if (productText.includes(tag.toLowerCase())) {
      score += 2;
    }
  });

  // 3. Recent search query relevance
  if (searchTerms) {
    const terms = searchTerms.split(' ').filter(term => term.length > 2);
    terms.forEach(term => {
      if (productText.includes(term)) {
        score += 4;
      }
    });
  }

  // 4. High conversion / Best-seller boost
  if (product.badge?.toLowerCase().includes('best seller') || product.isBestSeller || product.isFeatured) {
    score += 1.5;
  }

  return score;
}

/**
 * Google Gemini API integration for Semantic AI Matching & Intent analysis.
 * Classifies, filters, and ranks products matching the user's natural language request.
 * NOTE: Initializing Gemini client-side is done here upon explicit user request.
 * WARNING: Exposing the API key on the client side has security implications.
 */
export async function rankProductsWithGemini(
  query: string,
  products: Product[],
  apiKey?: string
): Promise<Product[]> {
  const finalApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).GEMINI_API_KEY;
  
  if (!finalApiKey || !query.trim() || products.length === 0) {
    // Graceful fallback to client-side scoring
    return fallbackRank(query, products);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: finalApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Provide Gemini with a catalog of product titles, IDs, categories and keywords to match
    const productCatalog = products.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      tags: p.tags || []
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `You are an expert search and discovery system for FileMarket.
Analyze this user natural language query: "${query}"
Select and rank the top matching product IDs from this catalog, ordering them by descending relevance.
Return only a JSON array of matching product IDs.

Catalog:
${JSON.stringify(productCatalog, null, 2)}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text?.trim() || "";
    const matchedIds: string[] = JSON.parse(text);

    if (Array.isArray(matchedIds)) {
      // Reorder products based on Gemini's ranking
      const matchedProducts = matchedIds
        .map(id => products.find(p => p.id === id))
        .filter((p): p is Product => !!p);

      // Append remaining products that were not matched by Gemini
      const unmatchedProducts = products.filter(p => !matchedIds.includes(p.id));
      return [...matchedProducts, ...unmatchedProducts];
    }
  } catch (err) {
    console.warn("Gemini AI matching failed, using keyword fallback ranking:", err);
  }

  return fallbackRank(query, products);
}

function fallbackRank(query: string, products: Product[]): Product[] {
  const lowerQuery = query.toLowerCase();
  return [...products].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const textA = `${a.title} ${a.category} ${a.description || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
    const textB = `${b.title} ${b.category} ${b.description || ''} ${(b.tags || []).join(' ')}`.toLowerCase();

    if (textA.includes(lowerQuery)) scoreA += 10;
    if (textB.includes(lowerQuery)) scoreB += 10;

    // Word boundary matches
    lowerQuery.split(' ').forEach(word => {
      if (word.length > 2) {
        if (textA.includes(word)) scoreA += 3;
        if (textB.includes(word)) scoreB += 3;
      }
    });

    // Best seller boost
    if (a.isBestSeller) scoreA += 1;
    if (b.isBestSeller) scoreB += 1;

    return scoreB - scoreA;
  });
}
