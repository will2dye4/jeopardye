import express from 'express';
import { getISODateString } from '../../utils.mjs';
import { getSeasonSummaries } from '../db.mjs';

async function handleGetSeasons(req, res, next) {
  const seasons = await getSeasonSummaries();
  seasons.forEach(season => {
    season.seasonStartDate = getISODateString(season.seasonStartDate);
    season.seasonEndDate = getISODateString(season.seasonEndDate);
  });
  res.json(seasons);
}

const router = express.Router();
router.get('/', handleGetSeasons);

export default router;
