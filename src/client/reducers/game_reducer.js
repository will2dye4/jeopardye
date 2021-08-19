import { ActionTypes } from '../actions/action_creators';
import {
  EventTypes,
  GAME_HISTORY_EVENT_TYPES,
  PLAYER_ID_KEY,
  StatusCodes,
} from '../../constants.mjs';
import { GameSettings } from '../../models/game.mjs';
import { getCurrentChampion, isDailyDouble } from '../../utils.mjs';

const WEBSOCKET_CONNECTION_REFUSED_ERROR_MESSAGE = '`redux-websocket` error';

let playerNames = {};

export function getPlayerName(playerID) {
  return playerNames[playerID] || playerID;
}

function newStoreData() {
  return {
    connected: false,
    error: null,
    errorContext: null,
    eventHistory: [],
    hostOverride: null,
    playerID: localStorage.getItem(PLAYER_ID_KEY) || null,
    redirectToHome: false,
    roomID: null,
    room: null,
    board: null,
    game: null,
    gameSettings: new GameSettings(),
    gameStarting: false,
    players: {},
    answerDelayMillis: 0,
    activeClue: null,
    skippedClue: false,
    playerAnswering: null,
    playerInControl: null,
    playerInControlReassigned: false,
    playersMarkingClueInvalid: [],
    playersReadyForNextRound: [],
    playersVotingToSkipClue: [],
    prevAnswer: null,
    currentWager: null,
    allowAnswers: false,
    revealAnswer: false,
    responseTimerElapsed: false,
    roundSummary: null,
    roomLinkRequestSucceeded: false,
    roomLinkRequests: {},
    rooms: {},
    allPlayers: {},
    leaderboards: null,
  };
}

function shouldIgnoreError(eventType, status) {
  return (eventType === EventTypes.BUZZ_IN && status === StatusCodes.CONFLICT);
}

function shouldPropagateError(eventType) {
  return (eventType === EventTypes.JOIN_ROOM_WITH_CODE);
}

function handleError(storeData, event) {
  const { eventType, error, status } = event.payload;
  console.log(`Request to ${eventType} failed: ${error} (${status})`);
  if (shouldIgnoreError(eventType, status)) {
    return storeData;
  }
  if (shouldPropagateError(eventType)) {
    return {...storeData, errorContext: event.payload};
  }
  return {...storeData, error: `Failed to ${eventType.replaceAll('_', ' ')}.`};
}

function handleNewGame(storeData, newGame) {
  if (newGame?.error) {
    return {...storeData, error: newGame.error, gameStarting: false};
  }
  if (!newGame) {
    return {...storeData, board: null, game: null, gameStarting: false, roundSummary: null};
  }
  if (newGame.gameID === storeData.game?.gameID) {
    return storeData;
  }
  const newBoard = newGame.rounds[newGame.currentRound];
  let newPlayers = {...storeData.players};
  Object.entries(newGame.scores).forEach(([playerID, score]) => {
    if (newPlayers.hasOwnProperty(playerID)) {
      newPlayers[playerID].score = score;
    } else {
      /* this can happen if the current game is fetched before the PLAYER_WENT_ACTIVE event fires */
      newPlayers[playerID] = {playerID, score};
    }
  });
  Object.values(newPlayers).forEach(player => {
    if (!newGame.scores.hasOwnProperty(player.playerID)) {
      player.score = 0;
    }
  });
  return {
    ...storeData,
    eventHistory: [],
    game: newGame,
    gameStarting: false,
    board: newBoard,
    players: newPlayers,
    activeClue: newGame.activeClue,
    playersMarkingClueInvalid: newGame.activeClue?.playersMarkingInvalid || [],
    playersReadyForNextRound: newGame.playersReadyForNextRound || [],
    playersVotingToSkipClue: newGame.activeClue?.playersVotingToSkip || [],
    playerAnswering: newGame.playerAnswering,
    playerInControl: newGame.playerInControl,
    prevAnswer: null,
    redirectToHome: false,
    roundSummary: newGame.roundSummary || null,
  };
}

function handleGameStarting(storeData, _) {
  console.log(`New game starting...`);
  return {...storeData, gameStarting: true};
}

function handleGameStarted(storeData, event) {
  const { game } = event.payload;
  console.log(`New game started: ${game.gameID}`);
  return handleNewGame(storeData, game);
}

function handleGameSettingsChanged(storeData, event) {
  const { settings } = event.payload;
  console.log('Game settings changed.');
  return {...storeData, gameSettings: settings};
}

function handleRoundStarted(storeData, event) {
  const { round, playerInControl } = event.payload;
  const newGame = {...storeData.game, currentRound: round};
  return {
    ...storeData,
    board: storeData.game.rounds[round],
    game: newGame,
    playerInControl: playerInControl,
    playersReadyForNextRound: [],
    roundSummary: null,
  };
}

function handleRoundEnded(storeData, event) {
  const { gameOver, places, round } = event.payload;
  console.log(`Reached the end of the ${round} round.`);
  const newStore = {...storeData, roundSummary: event.payload};
  if (gameOver) {
    let newRoom = {...storeData.room};
    const currentChampion = getCurrentChampion(places);
    if (currentChampion && currentChampion === storeData.room.currentChampion) {
      newRoom.currentWinningStreak = storeData.room.currentWinningStreak + 1;
    } else {
      newRoom.currentChampion = currentChampion;
      newRoom.currentWinningStreak = (currentChampion ? 1 : 0);
    }
    newStore.room = newRoom;
  }
  return newStore;
}

function handlePlayerInControlReassigned(storeData, event) {
  const { newPlayerInControl } = event.payload;
  console.log(`${getPlayerName(newPlayerInControl)} is now in control.`);
  return {...storeData, playerInControl: newPlayerInControl, playerInControlReassigned: true};
}

function handleRoomHostReassigned(storeData, event) {
  const { newHostPlayerID } = event.payload;
  console.log(`${getPlayerName(newHostPlayerID)} is now the host.`);
  const newRoom = {...storeData.room, hostPlayerID: newHostPlayerID};
  return {...storeData, room: newRoom};
}

function handlePlayerJoinedRoom(storeData, event) {
  const { roomID, playerID, players } = event.payload;
  const player = players[playerID];
  console.log(`${player.name} has joined the room.`);
  Object.entries(players).forEach(([playerID, player]) => {
    if (storeData.players.hasOwnProperty(playerID)) {
      player.score = storeData.players[playerID].score;
    }
    if (!playerNames.hasOwnProperty(playerID)) {
      playerNames[playerID] = player.name;
    }
  });
  let newStore = {...storeData, players: players};
  if (storeData.room) {
    newStore.room = {...storeData.room, playerIDs: Object.keys(players)};
  }
  if (playerID === storeData.playerID) {
    newStore.redirectToHome = false;
    newStore.roomID = roomID;
  }
  return newStore;
}

function handlePlayerLeftRoom(storeData, event) {
  const { roomID, playerID, newHostPlayerID } = event.payload;
  if (roomID !== storeData.roomID) {
    console.log(`Ignoring player left event for room ${roomID}.`);
    return storeData;
  }
  let newStore = {...storeData};
  if (storeData.players.hasOwnProperty(playerID)) {
    if (playerID === storeData.playerID) {
      const newPlayer = {...storeData.players[playerID], currentRoomID: null, score: 0};
      return {...newStoreData(), connected: true, players: {[playerID]: newPlayer}, redirectToHome: true};
    }
    const player = storeData.players[playerID];
    console.log(`${player.name} has left the room.`);
    let newPlayer = {...player, active: false};
    newStore.players = {...storeData.players, [playerID]: newPlayer};
  } else {
    console.log(`Ignoring player left event for unknown player ${playerID}.`);
  }
  if (newHostPlayerID) {
    console.log(`${getPlayerName(newHostPlayerID)} is now the host.`);
    newStore.room = {...storeData.room, hostPlayerID: newHostPlayerID};
  }
  return newStore;
}

function handlePlayerChangedName(storeData, event) {
  const { playerID, name, preferredFontStyle, prevName } = event.payload;
  if (!storeData.players.hasOwnProperty(playerID)) {
    console.log(`Cannot change name of unknown player "${playerID}".`);
    return storeData;
  }
  console.log(`Player changed name from "${prevName}" to "${name}" (font: ${preferredFontStyle}).`);
  playerNames[playerID] = name;
  const newPlayer = {...storeData.players[playerID], name: name, preferredFontStyle: preferredFontStyle};
  const newPlayers = {...storeData.players, [playerID]: newPlayer};
  return {...storeData, players: newPlayers};
}

function handlePlayerJoined(storeData, event) {
  const { player } = event.payload;
  console.log(`${player.name} has joined the game.`);
  let newPlayers = {...storeData.players, [player.playerID]: {...player, score: player.score || storeData.players[player.playerID]?.score}};
  let newStoreData = {...storeData, players: newPlayers};
  if (storeData.game && !storeData.game.playerIDs.includes(player.playerID)) {
    newStoreData.game = {...storeData.game, playerIDs: storeData.game.playerIDs.concat(player.playerID)};
  }
  return newStoreData;
}

function handlePlayerSelectedClue(storeData, event) {
  const { categoryID, clueID } = event.payload.context;
  const category = storeData.board.categories[categoryID];
  const clues = category.clues;
  const clueIndex = clues.map(clue => clue.clueID).indexOf(clueID);
  if (clueIndex === -1) {
    console.log(`Player selected invalid clue: ${clueID} (category ${categoryID})`);
    return storeData;
  }
  const clue = {...clues[clueIndex], category: category.name, played: true, playersAttempted: []};
  const newBoard = {...storeData.board};
  newBoard.categories[categoryID].clues[clueIndex] = clue;
  console.log(`Playing ${category.name} for $${clue.value}.`);
  return {
    ...storeData,
    activeClue: clue,
    board: newBoard,
    currentWager: null,
    playersMarkingClueInvalid: [],
    playersVotingToSkipClue: [],
    prevAnswer: null,
    revealAnswer: false,
    skippedClue: false,
  };
}

function handlePlayerBuzzed(storeData, event) {
  const { playerID } = event.payload.context;
  console.log(`${getPlayerName(playerID)} buzzed in.`);
  const activeClue = {...storeData.activeClue, playersAttempted: storeData.activeClue.playersAttempted.concat(playerID)};
  return {...storeData, activeClue: activeClue, playerAnswering: playerID, prevAnswer: null, responseTimerElapsed: false};
}

function handlePlayerAnswered(storeData, event) {
  const { answer, answerDelayMillis, correct, score } = event.payload;
  const { clueID, playerID } = event.payload.context;
  const dailyDouble = isDailyDouble(storeData.board, clueID);
  const allowAnswers = (!correct && !dailyDouble && playerID !== storeData.playerID);
  console.log(`${getPlayerName(playerID)} answered "${answer}" (${correct ? 'correct' : 'incorrect'}).`);
  const newPlayer = {...storeData.players[playerID], score: score};
  const newPlayers = {...storeData.players, [playerID]: newPlayer};
  let newStoreData = {
    ...storeData,
    players: newPlayers,
    playerAnswering: null,
    prevAnswer: event.payload,
    currentWager: null,
    allowAnswers: allowAnswers,
    answerDelayMillis: answerDelayMillis,
  };
  if (correct) {
    newStoreData.activeClue = null;
    newStoreData.playerInControl = playerID;
    newStoreData.revealAnswer = false;
  } else if (dailyDouble) {
    newStoreData.revealAnswer = true;
  }
  return newStoreData;
}

function handlePlayerWagered(storeData, event) {
  const { playerID, wager } = event.payload;
  console.log(`${getPlayerName(playerID)} wagered $${wager.toLocaleString()}.`);
  return {...storeData, currentWager: wager, playerAnswering: playerID, responseTimerElapsed: false};
}

function handlePlayerMarkedClueAsInvalid(storeData, event) {
  const { categoryID, clueID, playerID } = event.payload.context;
  const name = getPlayerName(playerID);
  if (storeData.activeClue.categoryID !== categoryID || storeData.activeClue.clueID !== clueID) {
    console.log(`Ignoring player marking non-active clue ${clueID} (category ${categoryID}) as invalid.`);
    return storeData;
  }
  if (storeData.playersMarkingClueInvalid.includes(playerID)) {
    console.log(`Ignoring player marking active clue as invalid because ${name} already marked this clue.`);
    return storeData;
  }
  console.log(`${name} marked clue ${clueID} (category ${categoryID}) as invalid.`);
  return {...storeData, playersMarkingClueInvalid: storeData.playersMarkingClueInvalid.concat(playerID)};
}

function handlePlayerVotedToSkipClue(storeData, event) {
  const { categoryID, clueID, playerID } = event.payload.context;
  const name = getPlayerName(playerID);
  if (storeData.activeClue.categoryID !== categoryID || storeData.activeClue.clueID !== clueID) {
    console.log(`Ignoring vote to skip non-active clue ${clueID} (category ${categoryID}).`);
    return storeData;
  }
  if (storeData.playersVotingToSkipClue.includes(playerID)) {
    console.log(`Ignoring vote to skip active clue because ${name} already voted for this clue.`);
    return storeData;
  }
  console.log(`${name} voted to skip clue ${clueID} (category ${categoryID}).`);
  return {...storeData, playersVotingToSkipClue: storeData.playersVotingToSkipClue.concat(playerID)};
}

function handleHostAbandonedGame(storeData, event) {
  const gameID = event.payload.context.gameID;
  console.log(`Host abandoned game ${gameID}.`);
  return handleNewGame(storeData, null);
}

function handleHostKickedPlayer(storeData, event) {
  const { playerID } = event.payload;
  if (playerID === storeData.playerID) {
    const newPlayer = {...storeData.players[playerID], currentRoomID: null, score: 0};
    return {...newStoreData(), connected: true, players: {[playerID]: newPlayer}, redirectToHome: true};
  }
  console.log(`Host kicked ${getPlayerName(playerID)}.`);
  const newPlayer = {...storeData.players[playerID], active: false};
  const newPlayers = {...storeData.players, [playerID]: newPlayer};
  return {...storeData, players: newPlayers};
}

function handleHostOverrodeServerDecision(storeData, event) {
  const { value, score } = event.payload;
  const playerID = event.payload.context.playerID;
  const name = getPlayerName(playerID);
  console.log(`Host overrode server's decision on ${name}'s previous answer (+$${value.toLocaleString()}).`);
  const newPlayer = {...storeData.players[playerID], score: score};
  const newPlayers = {...storeData.players, [playerID]: newPlayer};
  return {...storeData, hostOverride: event.payload, players: newPlayers};
}

function handlePlayerWentActive(storeData, event) {
  const { playerID, players } = event.payload;
  Object.entries(players).forEach(([playerID, player]) => {
    if (storeData.players.hasOwnProperty(playerID)) {
      player.score = storeData.players[playerID].score;
    }
    if (!playerNames.hasOwnProperty(playerID)) {
      playerNames[playerID] = player.name;
    }
  });
  console.log(`${getPlayerName(playerID)} went active.`);
  return {...storeData, players: players};
}

function handlePlayerWentInactive(storeData, event) {
  const { playerID } = event.payload;
  if (storeData.players.hasOwnProperty(playerID)) {
    console.log(`${getPlayerName(playerID)} went inactive.`);
    const newPlayer = {...storeData.players[playerID], active: false};
    const newPlayers = {...storeData.players, [playerID]: newPlayer};
    return {...storeData, players: newPlayers};
  }
  console.log(`Ignoring status change for unknown player ${playerID}.`);
  return storeData;
}

function handlePlayerSpectatingStatusChanged(status) {
  return function handleStatusChanged(storeData, event) {
    const { playerID } = event.payload;
    if (storeData.players.hasOwnProperty(playerID)) {
      console.log(`${getPlayerName(playerID)} ${status ? 'started' : 'stopped'} spectating.`);
      const newPlayer = {...storeData.players[playerID], spectating: status};
      const newPlayers = {...storeData.players, [playerID]: newPlayer};
      return {...storeData, players: newPlayers};
    }
    console.log(`Ignoring spectating status change for unknown player ${playerID}.`);
    console.log(Object.keys(storeData.players));
    return storeData;
  };
}

function handlePlayerMarkedReadyForNextRound(storeData, event) {
  const { playerID } = event.payload.context;
  if (storeData.playersReadyForNextRound.includes(playerID)) {
    return storeData;
  }
  console.log(`${getPlayerName(playerID)} is ready for the next round.`);
  return {...storeData, playersReadyForNextRound: storeData.playersReadyForNextRound.concat(playerID)};
}

function handleBuzzingPeriodEnded(storeData, event) {
  const { categoryID, clueID } = event.payload.context;
  if (storeData.activeClue?.clueID === clueID) {
    console.log(`Time expired for clue ${clueID} (category ${categoryID}).`);
    return {...storeData, playerAnswering: null, allowAnswers: false, revealAnswer: true, skippedClue: event.payload.skipped};
  }
  return storeData;
}

function handleResponsePeriodEnded(storeData, event) {
  const { answerDelayMillis, score } = event.payload;
  const { clueID, playerID } = event.payload.context;
  console.log(`Response time expired for ${getPlayerName(playerID)}.`);
  const dailyDouble = isDailyDouble(storeData.board, clueID);
  const newPlayer = {...storeData.players[playerID], score: score};
  return {
    ...storeData,
    currentWager: null,
    responseTimerElapsed: true,
    revealAnswer: dailyDouble,
    answerDelayMillis: answerDelayMillis,
    players: {...storeData.players, [playerID]: newPlayer},
    playerAnswering: null,
  };
}

function handleWaitingPeriodEnded(storeData, event) {
  const { categoryID, clueID } = event.payload.context;
  console.log(`Now accepting answers for clue ${clueID} (category ${categoryID}).`);
  return {...storeData, allowAnswers: true};
}

const eventHandlers = {
  [EventTypes.ERROR]: handleError,
  [EventTypes.GAME_STARTING]: handleGameStarting,
  [EventTypes.GAME_STARTED]: handleGameStarted,
  [EventTypes.GAME_SETTINGS_CHANGED]: handleGameSettingsChanged,
  [EventTypes.ROUND_STARTED]: handleRoundStarted,
  [EventTypes.ROUND_ENDED]: handleRoundEnded,
  [EventTypes.PLAYER_IN_CONTROL_REASSIGNED]: handlePlayerInControlReassigned,
  [EventTypes.ROOM_HOST_REASSIGNED]: handleRoomHostReassigned,
  [EventTypes.PLAYER_JOINED_ROOM]: handlePlayerJoinedRoom,
  [EventTypes.PLAYER_LEFT_ROOM]: handlePlayerLeftRoom,
  [EventTypes.PLAYER_CHANGED_NAME]: handlePlayerChangedName,
  [EventTypes.PLAYER_JOINED]: handlePlayerJoined,
  [EventTypes.PLAYER_SELECTED_CLUE]: handlePlayerSelectedClue,
  [EventTypes.PLAYER_BUZZED]: handlePlayerBuzzed,
  [EventTypes.PLAYER_ANSWERED]: handlePlayerAnswered,
  [EventTypes.PLAYER_WAGERED]: handlePlayerWagered,
  [EventTypes.PLAYER_MARKED_CLUE_AS_INVALID]: handlePlayerMarkedClueAsInvalid,
  [EventTypes.PLAYER_VOTED_TO_SKIP_CLUE]: handlePlayerVotedToSkipClue,
  [EventTypes.HOST_ABANDONED_GAME]: handleHostAbandonedGame,
  [EventTypes.HOST_KICKED_PLAYER]: handleHostKickedPlayer,
  [EventTypes.HOST_OVERRODE_SERVER_DECISION]: handleHostOverrodeServerDecision,
  [EventTypes.PLAYER_STARTED_SPECTATING]: handlePlayerSpectatingStatusChanged(true),
  [EventTypes.PLAYER_STOPPED_SPECTATING]: handlePlayerSpectatingStatusChanged(false),
  [EventTypes.PLAYER_MARKED_READY_FOR_NEXT_ROUND]: handlePlayerMarkedReadyForNextRound,
  [EventTypes.PLAYER_WENT_ACTIVE]: handlePlayerWentActive,
  [EventTypes.PLAYER_WENT_INACTIVE]: handlePlayerWentInactive,
  [EventTypes.BUZZING_PERIOD_ENDED]: handleBuzzingPeriodEnded,
  [EventTypes.RESPONSE_PERIOD_ENDED]: handleResponsePeriodEnded,
  [EventTypes.WAITING_PERIOD_ENDED]: handleWaitingPeriodEnded,
}

function handleWebsocketEvent(storeData, event) {
  if (event.hasOwnProperty('message')) {
    event = JSON.parse(event.message);
  }
  const eventType = event.eventType;
  if (eventHandlers.hasOwnProperty(eventType)) {
    const handler = eventHandlers[eventType];
    let newStore = handler(storeData, event);
    if (GAME_HISTORY_EVENT_TYPES.has(event.eventType)) {
      newStore.eventHistory = storeData.eventHistory.concat({
        ...event,
        clue: newStore.activeClue,
        round: newStore.game?.currentRound || null,
        timestamp: Date.now(),
      });
    }
    return newStore;
  } else {
    console.log(`Ignoring event with unknown type: ${eventType} (${JSON.stringify(event)})`);
    return storeData || newStoreData();
  }
}

export function GameReducer(storeData, action) {
  let response;
  switch (action.type) {
    case ActionTypes.CREATE_NEW_ROOM:
    case ActionTypes.FETCH_ROOM:
      const room = action.payload;
      if (!room) {
        console.log(`Failed to ${action.type === ActionTypes.CREATE_NEW_ROOM ? 'create' : 'fetch'} room.`);
        return {...storeData, roomID: null, room: null, leaderboards: null};
      }
      if (room.error) {
        if (action.type === ActionTypes.CREATE_NEW_ROOM && room.status) {
          return {...storeData, errorContext: {...room, eventType: action.type}};
        }
        return {...storeData, error: room.error};
      }
      if (room.kickedPlayerIDs.hasOwnProperty(storeData.playerID)) {
        return {...storeData, error: 'Failed to join room.', roomID: null, room: null, leaderboards: null};
      }
      if (room.playerIDs.includes(storeData.playerID)) {
        return {...storeData, redirectToHome: false, roomID: room.roomID, room: room, leaderboards: null};
      }
      return {...storeData, roomID: room.roomID};
    case ActionTypes.FETCH_ROOM_LEADERBOARDS:
      const leaderboards = action.payload;
      if (!leaderboards) {
        console.log('Failed to fetch room leaderboards.');
        return {...storeData, leaderboards: null};
      }
      if (leaderboards.error) {
        return {...storeData, error: leaderboards.error};
      }
      return {...storeData, leaderboards: leaderboards};
    case ActionTypes.FETCH_ROOMS:
      response = action.payload;
      if (response.error) {
        return {...storeData, error: response.error};
      }
      let playerNames = storeData.rooms.playerNames;
      let rooms = storeData.rooms.rooms;
      if (response.page === 1) {
        playerNames = response.playerNames;
        rooms = response.rooms;
      } else {
        playerNames = {...playerNames, ...response.playerNames};
        rooms = rooms.concat(response.rooms);
      }
      const newRooms = {...response, playerNames: playerNames, rooms: rooms};
      return {...storeData, rooms: newRooms};
    case ActionTypes.FETCH_CURRENT_GAME:
    case ActionTypes.FETCH_GAME:
    case ActionTypes.FETCH_NEW_GAME:
      const newGame = action.payload;
      return handleNewGame(storeData, newGame);
    case ActionTypes.CREATE_NEW_PLAYER:
    case ActionTypes.FETCH_CURRENT_PLAYER:
    case ActionTypes.FETCH_PLAYER:
      const player = action.payload;
      if (!player) {
        console.log(`Failed to ${action.type === ActionTypes.CREATE_NEW_PLAYER ? 'create' : 'fetch'} player.`);
        localStorage.removeItem(PLAYER_ID_KEY);
        return {...storeData, playerID: null};
      }
      if (player.error) {
        return {...storeData, error: player.error};
      }
      const newPlayers = {...storeData.players, [player.playerID]: {...player, score: player.score || storeData.players[player.playerID]?.score}};
      let newStore = {...storeData, players: newPlayers};
      if (action.type === ActionTypes.CREATE_NEW_PLAYER) {
        localStorage.setItem(PLAYER_ID_KEY, player.playerID);
        newStore.playerID = player.playerID;
      }
      return newStore;
    case ActionTypes.FETCH_PLAYERS:
      response = action.payload;
      if (response.error) {
        return {...storeData, error: response.error};
      }
      let players = storeData.allPlayers.players;
      if (response.page === 1) {
        players = response.players;
      } else {
        players = players.concat(response.players);
      }
      const allPlayers = {...response, players: players};
      return {...storeData, allPlayers: allPlayers};
    case ActionTypes.FETCH_ROOM_LINK_REQUESTS:
      response = action.payload;
      if (response.error) {
        return {...storeData, error: response.error};
      }
      let newRequests = storeData.roomLinkRequests.requests;
      if (response.page === 1) {
        newRequests = response.requests;
      } else {
        newRequests = newRequests.concat(response.requests);
      }
      const newRoomLinkRequests = {...response, requests: newRequests};
      return {...storeData, roomLinkRequests: newRoomLinkRequests};
    case ActionTypes.REQUEST_NEW_ROOM_LINK:
      const roomLinkRequest = action.payload;
      if (roomLinkRequest.error) {
        const error = (roomLinkRequest.status === StatusCodes.CONFLICT ? 'Your previous request has not yet been approved.' : roomLinkRequest.error);
        return {...storeData, error: error};
      }
      console.log(`Created room link request ${roomLinkRequest.requestID}.`);
      return {...storeData, roomLinkRequestSucceeded: true};
    case ActionTypes.RESOLVE_ROOM_LINK_REQUEST:
      const request = action.payload;
      if (request.error) {
        return {...storeData, error: request.error};
      }
      let newReqs = {...storeData.roomLinkRequests};
      newReqs.requests.forEach(req => {
        if (req.requestID === request.requestID) {
          req.resolution = request.resolution;
          req.resolvedTime = request.resolvedTime;
        }
      });
      return {...storeData, roomLinkRequests: newReqs};
    case ActionTypes.DISMISS_CLUE:
      return {
        ...storeData,
        activeClue: null,
        playerAnswering: null,
        prevAnswer: null,
        allowAnswers: false,
        revealAnswer: false,
        responseTimerElapsed: false,
        skippedClue: false,
      };
    case ActionTypes.CLEAR_CURRENT_GAME:
      const { gameID } = action.payload;
      if (storeData.game?.gameID === gameID) {
        return {...storeData, game: null, board: null};
      }
      return storeData;
    case ActionTypes.CLEAR_ERROR:
      const { error } = action.payload;
      if (storeData.error === error) {
        return {...storeData, error: null};
      }
      if (storeData.errorContext === error) {
        return {...storeData, errorContext: null};
      }
      return storeData;
    case ActionTypes.CLEAR_HOST_OVERRIDE:
      const { override } = action.payload;
      if (storeData.hostOverride === override) {
        return {...storeData, hostOverride: null};
      }
      return storeData;
    case ActionTypes.CLEAR_PLAYER_IN_CONTROL_REASSIGNED:
      return {...storeData, playerInControlReassigned: false};
    case ActionTypes.CLEAR_ROOM_LINK_REQUEST_SUCCEEDED:
      return {...storeData, roomLinkRequestSucceeded: false};
    case ActionTypes.REDUX_WEBSOCKET_OPEN:
      return {...storeData, connected: true};
    case ActionTypes.REDUX_WEBSOCKET_CLOSED:
      return {...storeData, connected: false};
    case ActionTypes.REDUX_WEBSOCKET_ERROR:
      const { message, originalAction } = action.meta;
      if (!originalAction && message === WEBSOCKET_CONNECTION_REFUSED_ERROR_MESSAGE) {
        return {...storeData, error: 'Failed to connect to server. Trying to reconnect...'};
      }
      return storeData;
    case ActionTypes.REDUX_WEBSOCKET_MESSAGE:
      return handleWebsocketEvent(storeData, action.payload);
    default:
      return storeData || newStoreData();
  }
}
