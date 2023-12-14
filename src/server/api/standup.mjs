import express from 'express';
import log from 'log';
import { randomChoice, StatusCodes } from '@dyesoft/alea-core';
import { MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH } from '../../constants.mjs';
import { StandupTriviaCategory, StandupTriviaClue, StandupTriviaGame } from '../../models/standup.mjs';
import { getCategoryByID, getEpisodeCluesByCategoryID, getRandomCategoryIDs } from '../db.mjs';

const CATEGORIES_PER_GAME = 2;
const CLUES_PER_CATEGORY = 3;

const logger = log.get('api:standup');

async function createRandomStandupTriviaGame() {
    let game = null;
    while (!game) {
        const categoryIDs = await getRandomCategoryIDs(CATEGORIES_PER_GAME, false);
        game = await createStandupTriviaGameFromCategoryIDs(categoryIDs);
    }
    return game;
}

async function createStandupTriviaGameFromCategoryIDs(categoryIDs) {
    if (!categoryIDs) {
        return null;
    }

    let categories = [];
    let index = 0;
    for (const categoryID of categoryIDs) {
        const category = await getCategoryByID(categoryID);
        if (!category) {
            return null;
        }

        const episodes = await getEpisodeCluesByCategoryID(categoryID, true);
        if (episodes.filter(e => e.clues.filter(c => !c.isFinalJeopardy).length >= MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH).length === 0) {
            // If category doesn't have any episodes with enough clues for a round, bail out.
            return null;
        }

        let episode = null;
        if (episodes.length === 1) {
            episode = episodes[0];
        } else {
            while (!episode) {
                let randomEpisode = randomChoice(episodes);
                if (randomEpisode.clues.length >= MIN_REVEALED_CLUE_COUNT_FOR_CATEGORY_SEARCH) {
                    episode = randomEpisode;
                }
            }
        }

        // Take the right number of clues.
        let clues = [];
        episode.clues.forEach((clue, i) => {
            if (i < CLUES_PER_CATEGORY) {
                clues.push(new StandupTriviaClue(clue.clue, clue.answer));
            }
        });
        categories.push(new StandupTriviaCategory(category.name, clues, episode.episode[0].airDate));
        index++;
    }

    return new StandupTriviaGame(categories);
}

async function handleGetStandupTrivia(req, res, next) {
    logger.info('Creating a random standup trivia game.');
    let game;
    try {
        game = await createRandomStandupTriviaGame();
    } catch (e) {
        const error = new Error(`Failed to create standup trivia game: ${e}`);
        error.status = StatusCodes.INTERNAL_SERVER_ERROR;
        next(error);
        return;
    }
    res.json(game);
}

const router = express.Router();
router.get('/', handleGetStandupTrivia);

export default router;
