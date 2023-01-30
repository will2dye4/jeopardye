import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import expressWs from 'express-ws';
import fs from 'fs';
import http from 'http';
import https from 'https';
import log from 'log';
import logNode from 'log-node';
import config from '../config.json' assert { type: 'json' };
import db, { markAllPlayersInactive } from './db.mjs';
import category from './api/category.mjs';
import contestant from './api/contestant.mjs';
import episode from './api/episode.mjs';
import game from './api/game.mjs';
import player from './api/player.mjs';
import room from './api/room.mjs';
import roomLinkRequest from './api/roomLinkRequest.mjs';
import status from './api/status.mjs';
import { handleWebsocket } from './websockets.mjs';

const PORT = config.server.port;

logNode();
const logger = log.get('server');

const app = express();

let server;
if (config.ssl && config.ssl.certPath && config.ssl.keyPath) {
  const serverOptions = {
    cert: fs.readFileSync(config.ssl.certPath),
    key: fs.readFileSync(config.ssl.keyPath)
  };
  server = https.createServer(serverOptions, app);
} else {
  server = http.createServer(app);
}

expressWs(app, server);

app.use(bodyParser.json());
app.use(cors());
app.use('/api/category', category);
app.use('/api/contestant', contestant);
app.use('/api/episode', episode);
app.use('/api/game', game);
app.use('/api/player', player);
app.use('/api/room', room);
app.use('/api/request', roomLinkRequest);
app.use('/api/status', status);
app.ws('/api/ws', handleWebsocket);

server.listen(PORT);
logger.info(`API server running on port ${PORT}...`)

db.command({ping: 1}, {}, err => err ? logger.error(err) : logger.info('Connected to database.'));
markAllPlayersInactive(() => logger.info('All players reset to inactive.'));
