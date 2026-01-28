# ROADMAP.md - Evolución de ChefBot (Estrategia Oficial)

Este roadmap integra los pilares de `Prompt.md`, el flujo de `Introduccion.md` y las soluciones de `Gotchas.md`.

## 📍 Fase 1: Core & Business Logic (Completada)
*   [x] **Estructura Base:** Configuración de React 19 + Gemini.
*   [x] **Visión Artificial:** Implementación de `analyzeIngredientImage`.
*   [x] **Lógica Freemium:** Límites de generación y preguntas IA.
*   [x] **Entrada Manual Automatizada:** Sincronización Scanner -> Dashboard.

## 🚀 Fase 2: UX Premium & Nutrición (Completada)
*   [x] **Análisis Nutricional:** Macros y micronutrientes detallados para PRO.
*   [x] **Modo Cocina Interactiva:** Navegación paso a paso para recetas.
*   [x] **Sistema NutriScore IA:** Calificación de salud automática (A-E).
*   [x] **Favoritos Restringidos:** Solo para usuarios Premium.

## 🗄️ Fase 3: Infraestructura de Datos (Completada & Persistente)
*   [x] **Integración con Supabase:**
    *   [x] **Autenticación:** Email/Password y Google Login funcional.
    *   [x] **Tablas de Perfil:** Sincronización de `name`, `allergies`, `goals` y `avatarUrl`.
    *   [x] **Avatar Storage:** Subida de fotos de perfil a Bucket de Supabase protegida.
    *   [x] **Repositorio de Recetas:** Guardar historial de generaciones en la nube.
    *   [x] **Nube de Favoritos:** Sincronizar recetas guardadas entre dispositivos.
    *   [x] **Storage de Imágenes:** Almacenar fotos de ingredientes escaneados (Implementado para Avatars/Scans).

## 📊 Fase 4: Estabilidad y Performance (Optimización & Social)
*   [x] **Optimización de Imágenes:** Resize/Compresión pre-API + Lazy Loading en historial.
*   [x] **Social Link:** Generación de enlaces compartibles con Deep Linking funcional.
*   [x] **UI Dynamics:** Efectos de carga suaves (skeletons) y transiciones neón.
*   [x] **Offline Support:** Implementar PWA con cache para consulta de favoritos sin conexión y persistencia local.

## 🚀 Fase 5: Expansión (Core Finalizado)
*   [x] **Modo Cocina Guiado:** Control por voz manos libres ('siguiente', 'atrás') y narración por IA integrada.
*   [x] **Detección de Nutrientes:** Desglose detallado de macros (Kcal, Prot, etc.) por ingrediente escaneado.
*   [x] **Inventario Inteligente:** Gestión de despensa con seguimiento de caducidad y alertas visuales.

## 🏆 Fase 6: Gamificación & Comunidad (Engagement)
*   [x] **Retos de la IA:** Desafíos diarios para reducir el desperdicio (usar productos por caducar detectados en la despensa).
*   [x] **Community Feed:** Muro visual para compartir fotos de platos y recibir feedback neón.
*   [x] **Perfiles Públicos:** Seguimiento de otros chefs y visualización de estadísticas compartidas.

## 💳 Fase 8: Sistema de Pagos (Stripe Integration)
*   [ ] **Configuración Stripe:** Setup de cuenta, API Keys y Webhooks en dashboard.
*   [ ] **Backend de Pagos (Supabase Edge Functions):**
    *   [ ] Creación de clientes Stripe vinculados a `auth.users`.
    *   [ ] Endpoints para iniciar Checkout Sessions (Suscripción Monthly/Yearly).
    *   [ ] Manejo de Webhooks para actualizar estado `is_premium` en DB.
*   [ ] **Frontend de Suscripción:**
    *   [ ] Integración de planes en `PremiumModal` con redirección a Stripe Checkout.
    *   [ ] Portal de cliente para gestión de suscripción (cancelar/actualizar).
*   [ ] **Validación de Pagos:** Testing con tarjetas de prueba y manejo de estados (éxito, fallo, cancelado).

## 🛡️ Fase 9: Calidad y Despliegue (Production Ready)
*   [ ] **Auditoría de Seguridad (RLS):** Verificación de políticas de acceso a datos en Supabase.
*   [ ] **Limpieza de Código:** Eliminación de logs, deuda técnica y optimización de imports.
*   [ ] **Testing E2E:** Validación de flujos críticos (Registro -> Scan -> Cocina -> Social).
*   [ ] **Build & Deploy:** Configuración final de variables y generación de assets de producción.

## 🛠️ KPIs de Verificación
1.  **Persistencia:** El usuario no pierde datos al recargar la página.
2.  **Seguridad:** Los datos sensibles del perfil están protegidos via RLS (Row Level Security).
3.  **Velocidad:** Sincronización de base de datos en < 500ms tras acciones de usuario.
4.  **Accesibilidad:** Modo cocina navegable 100% por voz.
