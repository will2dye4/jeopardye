import { createStore } from 'redux';
import { GameReducer } from './game_reducer';

export const GameDataStore = createStore(GameReducer);
