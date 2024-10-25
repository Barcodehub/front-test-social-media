const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto del frontend según tu .env
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Frontend servidor corriendo en puerto ${PORT}`);
});