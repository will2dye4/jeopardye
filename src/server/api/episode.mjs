import express from 'express';
import { StatusCodes } from '../../constants.mjs';
import {
  getEpisodeCategories,
  getFullEpisodeByAirDate,
  getFullEpisodeByEpisodeID,
  getFullEpisodeByEpisodeNumber,
} from '../episodes.mjs';

async function handleGetEpisodeByID(req, res, next) {
  const episodeID = parseInt(req.params.episodeID);
  if (isNaN(episodeID)) {
    let err = new Error(`Invalid episode ID "${req.params.episodeID}"`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  } else {
    const episode = await getFullEpisodeByEpisodeID(episodeID);
    if (episode) {
      res.json(episode);
    } else {
      let err = new Error(`Episode "${episodeID}" not found`);
      err.status = StatusCodes.NOT_FOUND;
      next(err);
    }
  }
}

async function handleGetEpisodeByNumber(req, res, next) {
  const episodeNumber = parseInt(req.params.episodeNumber);
  if (isNaN(episodeNumber)) {
    let err = new Error(`Invalid episode number "${req.params.episodeNumber}"`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  } else {
    const episode = await getFullEpisodeByEpisodeNumber(episodeNumber);
    if (episode) {
      res.json(episode);
    } else {
      let err = new Error(`Episode #${episodeNumber} not found`);
      err.status = StatusCodes.NOT_FOUND;
      next(err);
    }
  }
}

async function handleGetEpisodeByAirDate(req, res, next) {
  const airDate = new Date(req.params.airDate);
  if (airDate.toString() === 'Invalid Date') {
    let err = new Error(`Invalid air date "${req.params.airDate}"`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  } else {
    const episode = await getFullEpisodeByAirDate(airDate);
    if (episode) {
      res.json(episode);
    } else {
      let err = new Error(`Episode for date ${airDate} not found`);
      err.status = StatusCodes.NOT_FOUND;
      next(err);
    }
  }
}

async function handleGetEpisodeCategories(req, res, next) {
  const episodeID = parseInt(req.params.episodeID);
  if (isNaN(episodeID)) {
    let err = new Error(`Invalid episode ID "${req.params.episodeID}"`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  } else {
    const categories = await getEpisodeCategories(episodeID);
    if (categories) {
      res.json(categories);
    } else {
      let err = new Error(`Episode "${episodeID}" not found`);
      err.status = StatusCodes.NOT_FOUND;
      next(err);
    }
  }
}

const router = express.Router();
router.get('/:episodeID', handleGetEpisodeByID);
router.get('/:episodeID/categories', handleGetEpisodeCategories);
router.get('/d/:airDate', handleGetEpisodeByAirDate);
router.get('/date/:airDate', handleGetEpisodeByAirDate);
router.get('/n/:episodeNumber', handleGetEpisodeByNumber);
router.get('/number/:episodeNumber', handleGetEpisodeByNumber);

export default router;
