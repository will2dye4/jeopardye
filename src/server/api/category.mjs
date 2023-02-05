import express from 'express';
import { MIN_CATEGORY_SEARCH_TERM_LENGTH, StatusCodes } from '../../constants.mjs';
import { Clue } from '../../models/game.mjs';
import {
  getCategoryByID,
  getCategoryCount,
  getCategorySummaries,
  getCategorySummariesForSearchTerm,
  getEpisodeCluesByCategoryID,
  getEpisodeCount,
} from '../db.mjs';

const MAX_CATEGORY_SEARCH_RESULTS = 1000;

async function handleGetCategories(req, res, next) {
  const categories = await getCategorySummaries();
  res.json(categories);
}

async function handleSearchCategories(req, res, next) {
  const searchTerm = req.params.term;
  if (searchTerm.trim().length < MIN_CATEGORY_SEARCH_TERM_LENGTH) {
    res.json({searchTerm: searchTerm, invalid: true});
  } else {
    const categories = await getCategorySummariesForSearchTerm(searchTerm);
    if (categories.length > MAX_CATEGORY_SEARCH_RESULTS) {
      res.json({searchTerm: searchTerm, invalid: true});
    } else {
      res.json({
        searchTerm: searchTerm,
        total: categories.length,
        categories: categories,
      });
    }
  }
}

async function handleGetCategoryStats(req, res, next) {
  const categoryCount = await getCategoryCount();
  const episodeCount = await getEpisodeCount();
  res.json({
    categoryCount: categoryCount,
    episodeCount: episodeCount,
  });
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
router.get('/search/:term', handleSearchCategories);
router.get('/stats', handleGetCategoryStats);
router.get('/:categoryID', handleGetCategoryByID);
router.get('/:categoryID/clues', handleGetCategoryClues);

export default router;
