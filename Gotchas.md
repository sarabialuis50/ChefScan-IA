# 🛡️ PROTOCOLO DE SEGURIDAD: NÚCLEO VITAL ChefCam.IA

Este documento es de lectura obligatoria antes de realizar cualquier cambio en el código.

## ⛔ FUNCIONES INTOCABLES (VITAL CORE)
No modificar estos archivos o funciones a menos que el usuario lo pida explícitamente para ARREGLAR un fallo en ellos:

1. **Reconocimiento de Imagen (`services/geminiService.ts` -> `analyzeIngredientImage`)**:
   -usa `gemini-2.0-flash`.
   -NO cambiar el prompt que ya reconoce el banano/aguacate.
   -NO añadir filtros de "confidence" externos.

2. **Generación de Recetas (`services/geminiService.ts` -> `generateRecipes`)**:
   -MANTENER el extractor de JSON manual con `indexOf('[')` y `lastIndexOf(']')`.
   -NO cambiar los parámetros de `photoQuery` (deben ser en inglés para Pexels).

3. **Integración UI-IA (`App.tsx` -> `handleScanComplete` y `handleStartGeneration`)**:
   -No tocar cómo se pasan los ingredientes de la cámara al texto manual.

4. **Flujo del Agente IA (`AIChatbot.tsx`)**:
   -No tocar la gestión de créditos ni la estructura de mensajes.

5. **Lógica de Negocio (Free vs Premium)**:
   -PROHIBIDO comentar o eliminar las validaciones de `chefCredits <= 0`.
   -PROHIBIDO alterar los límites diarios de generación de recetas (`dailyLimit`).
   -No modificar los redireccionamientos al modal de suscripción Premium.

## ⚠️ REGLA DE ORO
"Si el cambio solicitado es visual o de una vista específica, queda PROHIBIDO editar archivos en la carpeta `/services`, modificar el estado global en `App.tsx` que maneje la IA, o alterar cualquier restricción de uso para usuarios gratuitos."