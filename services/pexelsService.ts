const ENV_KEY = import.meta.env.VITE_PEXELS_API_KEY || "";
const FALLBACK_KEY = "NcAFAIe1Vdf4ufPGwuxFmjbCjWpf4yeCRrd4goHlM8rBaPD9c4S3UZEL";

export const getRecipeImage = async (query: string): Promise<string> => {
    const effectiveKey = ENV_KEY || FALLBACK_KEY;

    // Clean query: prioritize photoQuery words, ensuring they are valid for Pexels
    // We remove some common stop words and ensure it's simple
    let cleanQuery = (query || "delicious food").toLowerCase()
        .replace(/recipe|receta|con|with|style|estilo/gi, '')
        .replace(/[^\w\s]/gi, '')
        .trim();

    // If query is too long, take only first 3 words for better Pexels matching
    const words = cleanQuery.split(/\s+/);
    if (words.length > 3) {
        cleanQuery = words.slice(0, 3).join(' ');
    }

    const searchQuery = `${cleanQuery} food dish`;

    try {
        const fetchImage = async (q: string) => {
            const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape`;
            const response = await fetch(url, {
                headers: { Authorization: effectiveKey }
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data.photos?.[0]?.src?.large || null;
        };

        // Try primary query
        let imageUrl = await fetchImage(searchQuery);

        // If fails, try just the clean query without "food dish"
        if (!imageUrl) {
            imageUrl = await fetchImage(cleanQuery);
        }

        // If still fails, try a generic word if we have one
        if (!imageUrl && words.length > 0) {
            imageUrl = await fetchImage(words[0] + " meal");
        }

        if (imageUrl) return imageUrl;

        console.warn("Pexels found no matches for:", searchQuery);
        // High quality fallback from Unsplash (Food category)
        return `https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000`;

    } catch (error) {
        console.error("Pexels fetch error:", error);
        // Robust fallback
        return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000`;
    }
};
