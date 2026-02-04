const ENV_KEY = import.meta.env.VITE_PEXELS_API_KEY || "";
const FALLBACK_KEY = "NcAFAIe1Vdf4ufPGwuxFmjbCjWpf4yeCRrd4goHlM8rBaPD9c4S3UZEL";

export const getRecipeImage = async (query: string): Promise<string> => {
    // Determine effective key
    const effectiveKey = ENV_KEY || FALLBACK_KEY;

    if (!ENV_KEY) {
        console.warn("⚠️ Pexels Env Key missing, using fallback.");
    }

    // Clean query
    const cleanQuery = (query + " food dish").replace(/[^\w\s]/gi, '');

    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=1&orientation=landscape`, {
            headers: {
                Authorization: effectiveKey
            }
        });

        if (!response.ok) {
            console.warn(`Pexels Error ${response.status}:`, await response.text());
            throw new Error(`Pexels API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            return data.photos[0].src.large;
        }

        console.log("No photos found in Pexels for:", cleanQuery);
        // Fallback to Unsplash specific food search if Pexels fails
        return `https://images.unsplash.com/photo-1546767012-149539f9958e?auto=format&fit=crop&q=80&w=800`;
    } catch (error) {
        console.error("Error fetching image from Pexels, falling back:", error);
        // Robust Fallback
        return `https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800`;
    }
};
