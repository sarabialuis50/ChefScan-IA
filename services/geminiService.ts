
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Recipe, Ingredient } from "../types";
import { getRecipeImage } from "./pexelsService";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const ai = new GoogleGenAI({
  apiKey: API_KEY
});

export const analyzeIngredientImage = async (base64Image: string): Promise<Ingredient[]> => {
  const model = 'gemini-1.5-flash';

  const prompt = `Analiza esta imagen de comida. Identifica los ingredientes comestibles primarios. 
    Devuelve el resultado como un arreglo JSON de objetos con:
    - 'name' (string)
    - 'confidence' (number 0-100)
    - 'properties' (arreglo de strings como 'Orgánico', 'Vitamina C')
    - 'nutrients' (objeto con 'calories', 'protein', 'carbs', 'fat' como números estimativos por cada 100g).
    Sé conciso y solo incluye ingredientes claros. TODO EL TEXTO DEBE ESTAR EN ESPAÑOL.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre del ingrediente en español" },
              confidence: { type: Type.NUMBER },
              properties: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Propiedades o beneficios en español"
              },
              nutrients: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER }
                }
              }
            },
            required: ["name", "confidence"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error) {
    console.error("Error analyzing image:", error);
    return [];
  }
};

export const generateRecipes = async (
  ingredients: string[],
  portions: number,
  isPremium: boolean = false,
  allergies: string[] = [],
  cookingGoal: string = 'explorar'
): Promise<Recipe[]> => {
  const model = 'gemini-1.5-pro';

  const prompt = `Crea 5 recetas saludables y creativas usando principalmente estos ingredientes: ${ingredients.join(", ")}. 
    Las recetas deben ser para ${portions} porciones. 
    ${allergies.length > 0 ? `IMPORTANTE: El usuario es ALÉRGICO a: ${allergies.join(", ")}. Por favor, EVITA estrictamente estos ingredientes y cualquier contaminante cruzado común.` : ""}
    meta: ${cookingGoal}. Adapta las recetas para cumplir con esta meta (ej: bajo en calorías para bajar de peso, alto en proteína para ganar músculo).
    Incluye información nutricional (calorías, proteínas, carbohidratos, grasas), dificultad y tiempo de preparación.
    SISTEMA NUTRISCORE: Evalúa la salud de la receta y asigna un 'nutriScore' de 'A' (muy saludable) a 'E' (menos saludable).
    ${isPremium ? "SUGIERE también un arreglo de 2-3 'suggestedExtras' (ingredientes que el usuario NO mencionó pero que elevarían la receta a nivel gourmet)." : "NO sugieras ingredientes extra."}
    IMPORTANTE: Los títulos, la descripción, los nombres de los ingredientes y el modo de preparación DEBEN ESTAR EXCLUSIVAMENTE EN ESPAÑOL.
    Para el campo 'photoQuery', genera un término de búsqueda corto y descriptivo EN INGLÉS que ayude a encontrar una foto profesional del plato en un banco de imágenes (ej: 'gourmet salmon asparagus').
    Formatea la salida como un arreglo JSON de objetos Recipe.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING, description: "Título de la receta en español" },
              description: { type: Type.STRING, description: "Breve descripción en español" },
              portions: { type: Type.NUMBER },
              prepTime: { type: Type.STRING, description: "Tiempo de prep, ej: 20 min" },
              difficulty: { type: Type.STRING, description: "Dificultad en español: Fácil, Media, Difícil" },
              calories: { type: Type.STRING },
              protein: { type: Type.STRING },
              carbs: { type: Type.STRING },
              fat: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de ingredientes con cantidades en español"
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Pasos detallados de preparación en español"
              },
              matchPercentage: { type: Type.NUMBER },
              nutriScore: {
                type: Type.STRING,
                enum: ['A', 'B', 'C', 'D', 'E'],
                description: "Calificación NutriScore de la receta"
              },
              suggestedExtras: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Ingredientes extra sugeridos para mejorar la receta (Solo usuarios Premium)"
              },
              photoQuery: { type: Type.STRING, description: "Término de búsqueda en inglés para Pexels" }
            },
            required: ["id", "title", "ingredients", "instructions", "photoQuery"]
          }
        }
      }
    });

    const recipes: any[] = JSON.parse(response.text || "[]");

    // Enriquecer con imágenes de Pexels
    const recipesWithImages = await Promise.all(recipes.map(async (recipe) => {
      const imageUrl = await getRecipeImage(recipe.photoQuery || recipe.title);
      return { ...recipe, imageUrl };
    }));

    return recipesWithImages;
  } catch (error) {
    console.error("Error generating recipes:", error);
    return [];
  }
};

export const checkIngredientsConsistency = async (ingredients: string[]): Promise<string | null> => {
  if (ingredients.length < 2) return null;
  const model = 'gemini-1.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        parts: [{
          text: `Analiza esta lista de ingredientes: ${ingredients.join(", ")}. 
      ¿Hay alguna inconsistencia grave (ej: pescado con chocolate) o alguna sugerencia rápida para mejorar la combinación? 
      Responde en una sola frase corta (máximo 15 palabras) en español. Si todo está bien, responde 'OK'.` }]
      }],
    });

    const text = response.text || "";
    return text.includes("OK") ? null : text;
  } catch (error) {
    return null;
  }
};

export const chatWithChef = async (history: { role: string; parts: string[] }[], message: string, userContext?: any) => {
  // Detect complexity to switch models
  const complexKeywords = ['menú', 'plan', 'química', 'científico', 'técnica avanzada', 'explicación profunda', 'diseñar'];
  const isComplex = complexKeywords.some(kw => message.toLowerCase().includes(kw));
  const modelToUse = isComplex ? 'gemini-1.5-pro' : 'gemini-1.5-flash';

  const chat = ai.chats.create({
    model: modelToUse,
    config: {
      systemInstruction: `Eres el Maestro Chef AI de ChefScan.IA. Tu misión es elevar la experiencia culinaria del usuario. 
      CARACTERÍSTICAS:
      1. Eres un mentor de alta cocina: profesional, apasionado e inspiracional.
      2. No solo das recetas, explicas el 'por qué' técnico (breves menciones a reacciones de Maillard, emulsiones, o puntos de cocción ideales).
      3. Siempre sugieres sustituciones gourmet si falta un ingrediente.
      4. Mantén tus respuestas concisas (máximo 2 párrafos) para facilitar la lectura en móviles.
      5. Responde SIEMPRE en ESPAÑOL.
      
      CONTEXTO DEL USUARIO:
      - Nombre: ${userContext?.name || 'Chef'}
      - Alergias: ${userContext?.allergies?.join(', ') || 'Ninguna'}
      - Meta Culinaria: ${userContext?.cookingGoal || 'Explorar'}
      
      Usa este contexto para personalizar tus consejos y EVITA ingredientes alérgicos.
      
      CONOCIMIENTO DE LA APP CHEFSCAN.IA (Para Soporte):
      - Plan Premium: Cuesta $19.900 COP/mes. Incluye: ChefBot Ilimitado, 90 recetas/día, Despensa de 30 ítems, NutriScore completo, Guardar Favoritos.
      - Plan Free: Límite de 2 consultas diarias (10 recetas), Despensa de 5 ítems, 10 créditos de ChefBot, Sin favoritos.
      - Si el usuario pregunta por límites o cómo mejorar, explícale las ventajas de Premium amablemente.`
    }
  });

  const result = await chat.sendMessage({ message });
  return result.text;
};

export const processAudioInstruction = async (base64Audio: string, mimeType: string, userContext?: any) => {
  const model = 'gemini-1.5-flash';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            text: `Eres el Maestro Chef AI.Escucha la instrucción del usuario. 
          Responde de manera breve(máximo 40 palabras), profesional y llena de autoridad culinaria. 
          Enfócate en consejos prácticos sobre técnicas o ingredientes. 
          TODO EN ESPAÑOL.
          
          CONTEXTO DEL USUARIO:
        - Nombre: ${userContext?.name || 'Chef'}
- Alergias: ${userContext?.allergies?.join(', ') || 'Ninguna'}
- Meta Culinaria: ${userContext?.cookingGoal || 'Explorar'}
          
          Adapta tu tono y consejos a este perfil.` },
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
        ],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error processing audio instruction:", error);
    return "Lo siento, hubo un error al procesar tu mensaje de voz.";
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Use flash for TTS if possible or supported
      contents: [{ parts: [{ text: `Di de forma clara y profesional en español: ${text} ` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Error generating speech:", error);
    return undefined;
  }
};
