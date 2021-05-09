const cors = require('cors');
const express = require('express');
const game = require('./game');

const PORT = 3333;

const app = express();
app.use(cors());
app.use('/api/game', game);

app.listen(PORT, () => console.log(`API server running on port ${PORT}...`));
