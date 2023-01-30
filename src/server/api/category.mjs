import express from 'express';
import { StatusCodes } from '../../constants.mjs';
import { Clue } from '../../models/game.mjs';
import { getCategoryByID, getCategorySummaries, getEpisodeCluesByCategoryID } from '../db.mjs';

async function handleGetCategories(req, res, next) {
  const categories = await getCategorySummaries();
  categories.forEach(category => {
    if (category.unrevealedClueCount === 0) {
      delete category.unrevealedClueCount;
    }
  });
  res.json(categories);
}

async function handleGetCategoryByID(req, res, next) {
  const category = await getCategoryByID(req.params.categoryID);
  if (category) {
    res.json(category);
  } else {
    let err = new Error(`Category "${req.params.categoryID}" not found`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  }
}

async function handleGetCategoryClues(req, res, next) {
  const allEpisodeClues = await getEpisodeCluesByCategoryID(req.params.categoryID);
  if (allEpisodeClues) {
    let episodeClues = {};
    Object.entries(allEpisodeClues).forEach(([episodeID, clues]) => {
      episodeClues[episodeID] = clues.map(clue => Clue.fromEpisode(clue, null));
    });
    res.json(episodeClues);
  } else {
    let err = new Error(`Category "${req.params.categoryID}" not found`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  }
}

const router = express.Router();
router.get('/', handleGetCategories);
router.get('/:categoryID', handleGetCategoryByID);
router.get('/:categoryID/clues', handleGetCategoryClues);

export default router;
