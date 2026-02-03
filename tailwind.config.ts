export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./views/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "var(--primary)",
                "primary-dark": "var(--primary-dark)",
                "background-dark": "#0A0A0A",
                "pure-black": "#000000",
                "surface-dark": "#161616",
            },
            fontFamily: {
                display: ["Outfit", "sans-serif"],
                body: ["Inter", "sans-serif"],
                tech: ["Outfit", "sans-serif"], // Orbitron consolidado a Outfit
                outfit: ["Outfit", "sans-serif"],
            },
            animation: {
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 3s ease-in-out infinite',
                'scan': 'scan 3s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                scan: {
                    '0%, 100%': { top: '5%' },
                    '50%': { top: '95%' },
                }
            }
        },
    },
    plugins: [],
}
