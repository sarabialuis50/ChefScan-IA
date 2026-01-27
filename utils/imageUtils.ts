
/**
 * Redimensiona y comprime una imagen base64 para optimizar el envío a la API de Gemini.
 * @param base64Str La cadena base64 original de la imagen.
 * @param maxWidth El ancho máximo permitido.
 * @param maxHeight El alto máximo permitido.
 * @param quality La calidad de la compresión (0 a 1).
 * @returns Una promesa que resuelve con la cadena base64 optimizada (sin el prefijo data:image/...).
 */
export const resizeAndCompressImage = (
    base64Str: string,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${base64Str}`;

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Mantener la relación de aspecto
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('No se pudo obtener el contexto del canvas'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Exportar a base64 con compresión
            const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
            // Retornar solo la parte de los datos
            resolve(optimizedBase64.split(',')[1]);
        };

        img.onerror = (error) => reject(error);
    });
};
