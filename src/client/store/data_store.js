import { applyMiddleware, createStore } from 'redux';
import reduxWebsocket from '@giantmachines/redux-websocket';
import { asyncActions } from '../middleware/async_middleware';
import { GameReducer } from '../reducers/game_reducer';

const reduxWebsocketMiddleware = reduxWebsocket();

export const store = createStore(GameReducer, applyMiddleware(asyncActions, reduxWebsocketMiddleware));
