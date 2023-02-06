import express from 'express';
import { getISODateString } from '../../utils.mjs';
import {getEpisodeSummariesBySeasonNumber, getHighestSeasonNumber, getSeasonSummaries} from '../db.mjs';
import {StatusCodes} from "../../constants.mjs";

async function handleGetSeasons(req, res, next) {
  const seasons = await getSeasonSummaries();
  seasons.forEach(season => {
    season.seasonStartDate = getISODateString(season.seasonStartDate);
    season.seasonEndDate = getISODateString(season.seasonEndDate);
  });
  res.json(seasons);
}

async function handleGetSeasonEpisodeSummaries(req, res, next) {
  const maxSeasonNumber = await getHighestSeasonNumber();
  const seasonNumber = parseInt(req.params.seasonNumber);
  if (isNaN(seasonNumber) || seasonNumber < 1 || seasonNumber > maxSeasonNumber) {
    let err = new Error(`Season "${req.params.seasonNumber}" not found`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
    return;
  }
  const episodeSummaries = await getEpisodeSummariesBySeasonNumber(seasonNumber);
  res.json({
    seasonNumber: seasonNumber,
    episodes: episodeSummaries,
  });
}

const router = express.Router();
router.get('/', handleGetSeasons);
router.get('/:seasonNumber', handleGetSeasonEpisodeSummaries);

export default router;
