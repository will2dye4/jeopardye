import { applyMiddleware, createStore } from 'redux';
import { asyncActions } from './async_middleware';
import { GameReducer } from './game_reducer';

export const GameDataStore = createStore(GameReducer, applyMiddleware(asyncActions));
