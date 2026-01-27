<div align="center">
<img width="1200" height="475" alt="ChefScan IA Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🍳 ChefScan.IA — Cocina Inteligente con IA
### Transforma tus ingredientes en obras maestras culinarias con el poder de Google Gemini.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-orange?logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🚀 Descripción

**ChefScan.IA** es una aplicación web progresiva y futurista diseñada para revolucionar la cocina casera. Utilizando modelos avanzados de inteligencia artificial (Google Gemini), la aplicación permite a los usuarios escanear ingredientes físicamente o mediante entrada de texto para recibir recetas personalizadas, balanceadas y creativas en segundos.

Con una interfaz de estética **Cyberpunk-Minimalista**, ChefScan.IA no solo es una herramienta de cocina, sino un asistente integral que ofrece análisis nutricional, comandos de voz y una experiencia de usuario premium.

---

## ✨ Características Principales

- 📸 **Scanner de Ingredientes con Visión AI**: Detecta ingredientes automáticamente a través de la cámara del dispositivo utilizando `gemini-flash`.
- 🤖 **Generador de Recetas Inteligente**: Crea hasta 5 recetas personalizadas basadas en tus ingredientes y el número de porciones deseadas.
- 💬 **Chef Virtual (Chatbot)**: Un asistente culinario disponible 24/7 para resolver dudas sobre sustituciones, técnicas o consejos de cocina.
- 🎙️ **Comandos de Voz & TTS**: Escucha las instrucciones de tu Chef y envíale mensajes de voz para una experiencia manos libres en la cocina.
- 📊 **Análisis Nutricional**: Desglose detallado de calorías, proteínas, carbohidratos y grasas por receta.
- 📂 **Historial y Favoritos**: Guarda tus mejores descubrimientos culinarios y accede a tu historial de escaneos.
- 🌙 **Diseño Futurista**: Interfaz oscura con efectos de vidrio (glassmorphism) y animaciones de escaneo en tiempo real.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 (Hooks, Context, State Management).
- **Tooling**: Vite + TypeScript para un desarrollo rápido y seguro.
- **IA/ML**: 
  - `Google Generative AI (@google/genai)`
  - Modelos utilizados: `gemini-1.5-flash` (Visión) y `gemini-1.5-pro` (Texto/Chat).
- **Estilos**: Tailwind CSS (JIT) con variables personalizadas y animaciones clave.
- **Ecosistema**: ESM.sh para la gestión de módulos moderna.

---

## ⚙️ Instalación y Configuración

### 1. Requisitos Previos
- [Node.js](https://nodejs.org/) (Versión 18 o superior)
- Una API Key de [Google AI Studio](https://aistudio.google.com/)

### 2. Clonar e Instalar
```bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Entrar al directorio
cd ChefScan-IA

# Instalar dependencias
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env` o `.env.local` en la raíz del proyecto y añade tu clave de API:

```env
API_KEY=tu_gemini_api_key_aqui
```

### 4. Ejecución en Local
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## 📖 Uso

1. **Ingreso/Login**: Inicia sesión para personalizar tu experiencia (actualmente simulado en el Dashboard).
2. **Escanear**: Haz clic en el botón de cámara o selector de ingredientes.
3. **Generar**: Selecciona las porciones y deja que la IA trabaje.
4. **Cocinar**: Sigue los pasos detallados y usa el Chatbot si tienes dudas.
5. **Voz**: Usa el icono de micrófono para interactuar con el Chef sin tocar la pantalla.

---

## 🎨 Guía de Estilo

- **Primario**: `#39FF14` (Verde Neón)
- **Fondo**: `#000000` (Negro Puro) / `#161616` (Superficie)
- **Tipografía**:
  - *Display*: Space Grotesk
  - *Tech*: Orbitron
  - *Body*: Inter / Outfit

---

<div align="center">
Desarrollado con ❤️ por el equipo de ChefScan-IA.
</div>
