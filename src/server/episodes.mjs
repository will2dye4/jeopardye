import { Episode, EpisodeMetadata } from '../models/episode.mjs';
import { Category, Round } from '../models/game.mjs';
import {
  getCategoryCluesByEpisodeID,
  getEpisodeByEpisodeID,
  getEpisodeByEpisodeNumber,
  getEpisodeByAirDate,
  getEpisodeCategoriesByEpisodeID,
  getRandomEpisodeFromDateRange,
  getRandomEpisodeFromSeason,
} from './db.mjs';

export async function getFullEpisodeByEpisodeID(episodeID, isGame = false) {
  const episode = await getEpisodeByEpisodeID(episodeID);
  return await getFullEpisode(episode, isGame);
}

export async function getFullEpisodeByEpisodeNumber(episodeNumber, isGame = false) {
  const episode = await getEpisodeByEpisodeNumber(episodeNumber);
  return await getFullEpisode(episode, isGame);
}

export async function getFullEpisodeByAirDate(airDate, isGame = false) {
  const episode = await getEpisodeByAirDate(airDate);
  return await getFullEpisode(episode, isGame);
}

export async function getFullRandomEpisodeFromDateRange(startDate, endDate, isGame = false) {
  const episode = await getRandomEpisodeFromDateRange(startDate, endDate);
  return await getFullEpisode(episode, isGame);
}

export async function getFullRandomEpisodeFromSeason(seasonNumber, isGame = false) {
  const episode = await getRandomEpisodeFromSeason(seasonNumber);
  return await getFullEpisode(episode, isGame);
}

export async function getFullEpisode(episode, isGame = false) {
  if (!episode) {
    return null;
  }
  const categoryClues = await getCategoryCluesByEpisodeID(episode.episodeID);
  let rounds = {};
  Object.entries(episode.rounds).forEach(([roundName, round]) => {
    let categories = {};
    let dailyDoubles = [];
    if (round.hasOwnProperty('categoryIDs')) {
      round.categoryIDs.forEach(categoryID => {
        if (categoryClues.hasOwnProperty(categoryID)) {
          const category = round.categories.find(c => c.categoryID === categoryID);
          categoryClues[categoryID].forEach(clue => {
            if (clue.isDailyDouble) {
              dailyDoubles.push(clue.clueID);
            }
          });
          categories[categoryID] = Category.fromEpisode(category, categoryClues[categoryID], episode.episodeID, episode.airDate, isGame);
        }
      });
    }
    rounds[roundName] = Round.fromEpisode(categories, roundName, dailyDoubles);
  });
  const metadata = EpisodeMetadata.fromEpisode(episode);
  return new Episode(episode.episodeID, episode.episodeNumber, episode.seasonNumber, episode.airDate, metadata, rounds,
                     episode.hasUnrevealedClues, episode.hasInvalidRounds);
}

export async function getEpisodeCategories(episodeID) {
  const episodeCategories = await getEpisodeCategoriesByEpisodeID(episodeID);
  if (!episodeCategories) {
    return null;
  }
  let categories = {episodeID: episodeID, rounds: {}};
  Object.entries(episodeCategories.rounds).forEach(([roundName, round]) => {
    let roundCategories = {};
    if (round.categoryIDs?.length && round.categoryIDs.length === round.categories?.length) {
      round.categoryIDs.forEach(categoryID => {
        const category = round.categories.find(category => category.categoryID === categoryID);
        roundCategories[categoryID] = {name: category?.name || '<<Unknown Category>>'};
        if (category.hasOwnProperty('comments') && category.comments.hasOwnProperty(episodeID.toString())) {
          roundCategories[categoryID].comments = category.comments[episodeID.toString()];
        }
      });
    }
    categories.rounds[roundName] = {categories: roundCategories};
  });
  return categories;
}
