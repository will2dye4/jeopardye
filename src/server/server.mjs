import cors from 'cors';
import express from 'express';
import expressWs from 'express-ws';
import db from './db.mjs';
import game from './game.mjs';
import { handleWebsocket } from './websockets.mjs';

const PORT = 3333;

const app = express();
expressWs(app);

app.use(cors());
app.use('/api/game', game);
app.ws('/api/ws', handleWebsocket);

app.listen(PORT, () => console.log(`API server running on port ${PORT}...`));

db.command({ping: 1}, {}, err => err ? console.log(err) : console.log('Connected to database.'));
