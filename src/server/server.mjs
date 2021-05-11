import cors from 'cors';
import express from 'express';
import db from './db.mjs';
import game from './game.mjs';

const PORT = 3333;

const app = express();
app.use(cors());
app.use('/api/game', game);

app.listen(PORT, () => console.log(`API server running on port ${PORT}...`));

db.command({ping: 1}, {}, err => err ? console.log(err) : console.log('Connected to database.'));
