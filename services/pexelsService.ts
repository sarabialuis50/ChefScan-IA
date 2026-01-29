const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || "";

export const getRecipeImage = async (query: string): Promise<string> => {
    if (!PEXELS_API_KEY) {
        return `https://picsum.photos/seed/${query}/800/600`;
    }

    try {
        // Pexels API endpoint para búsqueda
        // Usamos per_page=1 para obtener solo la mejor coincidencia
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food dish")}&per_page=1&orientation=landscape`, {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        });

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            // Retornamos la imagen en tamaño large
            return data.photos[0].src.large;
        }

        // Fallback a picsum si no hay resultados
        return `https://picsum.photos/seed/${query}/800/600`;
    } catch (error) {
        console.error("Error fetching image from Pexels:", error);
        return `https://picsum.photos/seed/${query}/800/600`;
    }
};
