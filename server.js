const express = require('express');
const path = require('path');
const app = express();

// Hostinger asignará un puerto automáticamente a través de la variable de entorno PORT
const PORT = process.env.PORT || 3000;

// Servir los archivos estáticos desde la carpeta 'dist' (generada por Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Manejar todas las rutas enviando el index.html (necesario para React Router/SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`ChefScan.IA ejecutándose en el puerto ${PORT}`);
});
