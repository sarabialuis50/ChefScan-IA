
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, Ingredient } from "../types";
import { getRecipeImage } from "./pexelsService";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Configuración estable blindada
const ai = new GoogleGenAI({
  apiKey: API_KEY
});

export const analyzeIngredientImage = async (base64Image: string): Promise<Ingredient[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Analiza esta imagen y identifica los ingredientes comestibles principales. Devuelve un arreglo JSON de objetos con: name, confidence, properties, nutrients. TODO EN ESPAÑOL." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ]
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json\s*|\s*```/g, "").trim();
    return JSON.parse(cleanJson || "[]");
  } catch (error) {
    console.error("Error en visión:", error);
    return [];
  }
};

export const generateRecipes = async (
  ingredients: string[],
  portions: number,
  isPremium: boolean = false,
  allergies: string[] = [],
  cookingGoal: string = 'explorar',
  count: number = 5
): Promise<Recipe[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `Actúa como Chef Ejecutivo. Crea ${count} recetas creativas con: ${ingredients.join(", ")}. Porciones: ${portions}. Alergias: ${allergies ? allergies.join(", ") : "ninguna"}. Meta: ${cookingGoal}. 
        IMPORTANTE: Devuelve ÚNICAMENTE el arreglo JSON, sin introducciones.
        Formato: arreglo JSON de objetos Recipe con estos campos exactos:
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "portions": number,
          "prepTime": "string",
          "difficulty": "string",
          "calories": "string",
          "protein": "string",
          "carbs": "string",
          "fat": "string",
          "ingredients": ["string"],
          "instructions": ["string"],
          "tips": ["string"],
          "nutriScore": "A" | "B" | "C" | "D",
          "matchPercentage": number,
          "photoQuery": "string"
        }
        REGLA CRÍTICA: El campo "tips" DEBE ser un arreglo con la misma cantidad de elementos que "instructions". Cada tip debe ser un consejo profesional de chef específico para su paso correspondiente. No repitas tips.
        Asegúrate de que "photoQuery" sean 2-3 palabras clave en INGLÉS. Todo lo demás en ESPAÑOL.` }]
      }]
    });

    const text = response.text || "";
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');

    let cleanJson = "[]";
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanJson = text.substring(jsonStart, jsonEnd + 1);
    } else {
      cleanJson = text.replace(/```json\s*|\s*```/g, "").trim();
    }

    const recipes = JSON.parse(cleanJson || "[]");
    if (!Array.isArray(recipes) || recipes.length === 0) return [];

    return await Promise.all(recipes.map(async (recipe: any) => {
      try {
        const imageUrl = await getRecipeImage(recipe.photoQuery || recipe.title || "cooking");
        return { ...recipe, imageUrl };
      } catch {
        return { ...recipe, imageUrl: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800" };
      }
    }));
  } catch (error) {
    console.error("Error generando recetas:", error);
    return [];
  }
};

export const checkIngredientsConsistency = async (ingredients: string[]): Promise<string | null> => {
  if (ingredients.length < 2) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `Analiza: ${ingredients.join(", ")}. ¿Combinan? Responde OK o una frase corta en español.` }] }]
    });
    return response.text.includes("OK") ? null : response.text;
  } catch { return null; }
};

export const chatWithChef = async (history: { role: string; parts: string[] }[], message: string, userContext?: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: message }] }]
    });
    return response.text;
  } catch { return "Error en el chat."; }
};

export const processAudioInstruction = async (base64Audio: string, mimeType: string, userContext?: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user', parts: [
            { text: "Escucha este audio del usuario y responde brevemente en español." },
            { inlineData: { mimeType, data: base64Audio } }
          ]
        }
      ]
    });
    return response.text;
  } catch { return "Error en audio."; }
};

export const generateSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `Di esto: ${text}` }] }],
      // @ts-ignore
      config: { responseModalities: [Modality.AUDIO] }
    });
    return (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch { return undefined; }
};
