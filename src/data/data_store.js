import { applyMiddleware, createStore } from 'redux';
import reduxWebsocket from '@giantmachines/redux-websocket';
import { asyncActions } from './async_middleware';
import { GameReducer } from './game_reducer';

const reduxWebsocketMiddleware = reduxWebsocket();

export const store = createStore(GameReducer, applyMiddleware(asyncActions, reduxWebsocketMiddleware));
