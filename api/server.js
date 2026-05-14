const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas
const heatmapRoutes = require('./heatmap');
app.use('/api/heatmap', heatmapRoutes);

app.get('/', (req, res) => {
    res.send('Premium Hub API rodando...');
});

app.listen(PORT, () => {
    console.log(`API Premium Hub rodando na porta ${PORT}`);
});
