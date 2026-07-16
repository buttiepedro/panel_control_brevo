require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir frontend React
app.use(express.static(frontendDistPath));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✓ Conectado a MongoDB'))
.catch(err => console.error('✗ Error conectando a MongoDB:', err));

// Rutas API
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Servir el panel web (SPA)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 Panel: http://localhost:${PORT}`);
});
