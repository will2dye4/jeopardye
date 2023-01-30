import express from 'express';
import { StatusCodes } from '../../constants.mjs';
import { getContestantByID } from '../db.mjs';

async function handleGetContestantByID(req, res, next) {
  const contestantID = parseInt(req.params.contestantID);
  if (isNaN(contestantID)) {
    let err = new Error(`Invalid contestant ID "${req.params.contestantID}"`);
    err.status = StatusCodes.NOT_FOUND;
    next(err);
  } else {
    const contestant = await getContestantByID(contestantID);
    if (contestant) {
      res.json(contestant);
    } else {
      let err = new Error(`Contestant "${req.params.contestantID}" not found`);
      err.status = StatusCodes.NOT_FOUND;
      next(err);
    }
  }
}

const router = express.Router();
router.get('/:contestantID', handleGetContestantByID);

export default router;
