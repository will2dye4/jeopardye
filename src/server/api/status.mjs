import express from 'express';
import log from 'log';
import { StatusCodes } from '../../constants.mjs';
import packageJSON from '../../package.alias.json' assert { type: 'json' };
import db from '../db.mjs';

const logger = log.get('api:status');

async function handleGetHealth(req, res, next) {
  try {
    await db.command({ping: 1});
  } catch (e) {
    logger.error(`Failed to ping database: ${e}`);
    const error = new Error('Health check failed');
    error.status = StatusCodes.SERVICE_UNAVAILABLE;
    next(error);
    return;
  }
  res.status(StatusCodes.NO_CONTENT).end();
}

async function handleGetVersion(req, res, _) {
  res.json({version: packageJSON.version});
}

const router = express.Router();
router.get('/health', handleGetHealth);
router.get('/version', handleGetVersion);

export default router;
