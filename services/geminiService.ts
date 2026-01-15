
import { GoogleGenAI, Type } from "@google/genai";
import { AiParsedTransaction, Transaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseNaturalLanguageEntry = async (text: string): Promise<AiParsedTransaction[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this statement into an array of JSON objects: "${text}". 
      Each object should represent a distinct transaction. Identify amount, description, category, and payment mode (CASH, UPI, CARD, BANK, WALLET, NET_BANKING, OTHER).
      If the user lists multiple things like "10 apples and 10 pens", create two separate objects.
      Example: "Paid 500 for grocery and 200 for fuel using UPI" -> 
      [{ "amount": 500, "description": "Grocery", "category": "Groceries", "type": "EXPENSE", "paymentMode": "UPI" },
       { "amount": 200, "description": "Fuel", "category": "Transport", "type": "EXPENSE", "paymentMode": "UPI" }]`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
              paymentMode: { type: Type.STRING, enum: ["CASH", "UPI", "CARD", "BANK", "WALLET", "NET_BANKING", "OTHER"] }
            },
            required: ["amount", "description", "category", "type", "paymentMode"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as AiParsedTransaction[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return [];
  }
};

export const suggestCategories = async (text: string): Promise<{name: string, type: TransactionType, icon: string, color: string}[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract a list of financial categories from this text: "${text}". 
      Assign a suitable Lucide icon name, a hex color code, and the type (INCOME/EXPENSE).
      Icons should be from: Tag, Home, ShoppingCart, Coffee, Car, Tv, Zap, Heart, Banknote, Briefcase, TrendingUp, Plane, Book, Gift, Utensils, Smartphone, Stethoscope, Music, Dumbbell.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
              icon: { type: Type.STRING },
              color: { type: Type.STRING }
            },
            required: ["name", "type", "icon", "color"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return [];
  } catch (error) {
    console.error("Gemini Suggest Error:", error);
    return [];
  }
};

export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "Start logging your spends to get smart financial insights.";
  
  const history = transactions.slice(-20).map(t => {
    return `${t.date}: ${t.type} of ${t.amount} for ${t.description}`;
  }).join("\n");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a savvy financial mentor. Analyze these transactions and give ONE concise, friendly tip or observation. Be encouraging but realistic.
      Transactions:
      ${history}`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "Tracking your expenses is the first step to financial health!";
  } catch (error) {
    return "Budgeting is the first step to financial freedom!";
  }
};
