import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import expressWs from 'express-ws';
import log from 'log';
import logNode from 'log-node';
import db, { markAllPlayersInactive } from './db.mjs';
import game from './api/game.mjs';
import player from './api/player.mjs';
import room from './api/room.mjs';
import roomLinkRequest from './api/roomLinkRequest.mjs';
import { handleWebsocket } from './websockets.mjs';

const PORT = 3333;

logNode();
const logger = log.get('server');

const app = express();
expressWs(app);

app.use(bodyParser.json());
app.use(cors());
app.use('/api/game', game);
app.use('/api/player', player);
app.use('/api/room', room);
app.use('/api/request', roomLinkRequest);
app.ws('/api/ws', handleWebsocket);

app.listen(PORT, () => logger.info(`API server running on port ${PORT}...`));

db.command({ping: 1}, {}, err => err ? logger.error(err) : logger.info('Connected to database.'));
markAllPlayersInactive(() => logger.info('All players reset to inactive.'));
