import React from 'react';
import { CLUES_PER_CATEGORY, Rounds } from '../constants.mjs';
import './Game.css';

const PLAYER_ID = 'William';

function playSound(url) {
  new Audio(url).play().catch(console.log);
}

class Clue extends React.Component {
  handleClick() {
    if (!this.props.played) {
      this.props.onClick(this);
    }
  }

  render() {
    let classes = 'clue-border p-2';
    let text = <br />;
    if (!this.props.played) {
      classes += ' active-clue';
      text = `$${this.props.clue.value}`;
    }
    return (
      <div className="border border-2 clue col fw-bold text-center user-select-none" onClick={() => this.handleClick()}>
        <div className={classes}>{text}</div>
      </div>
    );
  }
}

class CurrentClue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reveal: props.reveal || false,
      text: props.reveal ? props.clue.answer : props.clue.question,
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.reveal && this.props.reveal) {
      this.revealAnswer();
    }
  }

  revealAnswer() {
    this.setState({
      reveal: true,
      text: this.props.clue.answer,
    });
  }

  handleClick() {
    if (this.state.reveal) {
      this.props.dismiss();
    } else if (this.props.allowAnswers) {
      this.props.buzzIn(this.props.gameID, PLAYER_ID, this.props.clue.categoryID, this.props.clue.clueID);
      this.revealAnswer();
      this.props.timerRef.current.reset();
    }
  }

  render() {
    const containerClasses = 'align-items-center current-clue-container row user-select-none animate__animated animate__zoomIn';
    const clueClasses = 'col-12 current-clue p-5 text-center text-uppercase';
    const board = document.getElementById('board');
    return (
      <div className={containerClasses} style={{width: board.offsetWidth * 1.02, height: board.offsetHeight}}>
        <div className={clueClasses} onClick={() => this.handleClick()}>{this.state.text}</div>
      </div>
    );
  }
}

class CountdownTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      finished: false,
      running: false,
      waiting: false,
      interval: props.seconds * 10,
      updater: null,
      value: 100,
    };
  }

  start() {
    if (!this.state.finished) {
      this.setState({waiting: true});
      const delay = (10 + Math.random()) * 1000;  // random delay between 10 and 11 seconds
      setTimeout(function() {
        const updater = setInterval(function() {
          const newValue = this.state.value - 1;
          const finished = (newValue <= 0);
          this.setState({finished: finished, running: !finished, value: newValue});
          if (finished) {
            this.cancelUpdater();
            if (this.props.onTimeElapsed) {
              this.props.onTimeElapsed();
            }
          }
        }.bind(this), this.state.interval);

        this.setState({
          running: true,
          waiting: false,
          updater: updater,
        });
        if (this.props.onTimeStarted) {
          this.props.onTimeStarted();
        }
      }.bind(this), delay);
    }
  }

  reset() {
    this.setState({
      finished: false,
      running: false,
      value: 100,
    });
    this.cancelUpdater();
  }

  cancelUpdater() {
    if (this.state.updater !== null) {
      clearInterval(this.state.updater);
      this.setState({updater: null});
    }
  }

  render() {
    let secondsRemaining, value;
    let classes = 'fs-5 progress-bar';
    if (this.state.waiting) {
      classes += ' bg-warning text-dark progress-bar-striped progress-bar-animated';
      secondsRemaining = 'Waiting...'
      value = 100;
    } else if (this.state.running) {
      classes += ' fw-bold bg-danger';
      secondsRemaining = Math.ceil(this.state.value * this.props.seconds / 100);
      value = this.state.value;
    } else {
      classes += ' bg-danger';
      value = 0;
    }
    return (
      <div className="countdown-timer progress mb-3 user-select-none">
        <div className={classes} style={{width: `${value}%`}} role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
          {secondsRemaining}
        </div>
      </div>
    );
  }
}

function StatusText(props) {
  const colorClasses = props.action ? 'bg-success' : 'bg-light text-dark';
  const classes = 'card mt-3 rounded-pill user-select-none ' + colorClasses;
  return (
    <div className={classes}>
      <div className="card-body">{props.text}</div>
    </div>
  );
}

function Podium(props) {
  let score = props.score.toLocaleString();
  let scoreClasses = 'py-2 podium-score';
  if (props.score < 0) {
    score = '-$' + score.substring(1);
    scoreClasses += ' podium-score-negative';
  } else {
    score = '$' + score;
  }
  return (
    <div className="mb-2 mx-4 podium row text-center user-select-none">
      <div className="col-2 podium-side podium-left-side">
        <div className="podium-stripe" />
        <div className="podium-stripe" />
      </div>
      <div className="col-4 podium-center">
        <div className={scoreClasses}>{score}</div>
        <div className="py-3 podium-name">{props.name}</div>
      </div>
      <div className="col-2 podium-side podium-right-side">
        <div className="podium-stripe" />
        <div className="podium-stripe" />
      </div>
    </div>
  );
}

function Board(props) {
  const headings = Object.values(props.categories).map(category => {
    let classes = 'align-items-center border border-2 category-heading col d-flex fw-bold justify-content-center p-3 ' +
                  'text-center text-uppercase user-select-none';
    let name = category.name;
    let words = name.split(' ');
    let meanLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (name.length > 30 || meanLength > 7 || (words.length > 3 && meanLength > 4)) {
      classes += ' small-heading';
    }
    return <div key={name} className={classes}>{name}</div>;
  });
  const rows = [...Array(CLUES_PER_CATEGORY).keys()].map(i => {
    const cells = Object.entries(props.categories).map(([id, category]) => {
      const clue = {...category.clues[i], category: category.name, categoryID: id};
      const played = props.playedClues.indexOf(clue.clueID) !== -1;
      return <Clue key={clue.clueID} clue={clue} played={played} onClick={() => props.handleClueClick(clue)} />;
    });
    return <div key={i} className="row row-cols-6">{cells}</div>;
  });
  let content = [
    <div key="headings" className="row row-cols-6">{headings}</div>,
    ...rows,
  ];
  if (props.showActiveClue && props.activeClue) {
    content.push(<CurrentClue key="current-clue"
                              gameID={props.gameID}
                              clue={props.activeClue}
                              allowAnswers={props.allowAnswers}
                              reveal={props.revealAnswer}
                              timerRef={props.timerRef}
                              buzzIn={props.buzzIn}
                              dismiss={props.dismissCurrentClue} />);
  }
  return <div id="board" className="position-relative">{content}</div>;
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    let status = 'Loading...';
    if (props.game) {
      const round = (props.game.currentRound === Rounds.SINGLE ? 'first' : 'second');
      status = `Game started. Let's play the ${round} round.`;
    }
    this.state = {
      activeClue: props.activeClue,
      playedClues: [],
      players: props.players,
      playerToAct: !!props.game,
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: !!props.activeClue,
      status: status,
      timerRef: React.createRef(),
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.game && this.props.game && !this.props.connected) {
      console.log('New game loaded. Opening websocket connection...');
      this.props.websocketConnect();
    }
    if (!prevProps.connected && this.props.connected && this.props.game) {
      console.log('Websocket connection successful. Joining game...');
      this.props.joinGame(this.props.game.gameID, PLAYER_ID, PLAYER_ID);
      const round = (this.props.game.currentRound === Rounds.SINGLE ? 'first' : 'second');
      this.setState({status: `Game started. Let's play the ${round} round.`, playerToAct: true});
    }
    if (prevProps.players !== this.props.players) {
      this.setState({players: this.props.players});
    }
    if (prevProps.activeClue !== this.props.activeClue) {
      this.setState({activeClue: this.props.activeClue});
    }
  }

  revealAnswer() {
    playSound(' https://www.soundboard.com/mediafiles/mt/MTMxOTQ5Nzc4MTMxOTcx_FJGXeSZhwls.mp3');
    this.setState({
      allowAnswers: false,
      revealAnswer: true,
      status: 'Time\'s up! No one buzzed in quickly enough.',
    });
  }

  dismissCurrentClue() {
    const playedClues = this.state.playedClues.concat(this.props.activeClue.clueID);
    const player = this.state.players[PLAYER_ID];
    const newPlayer = {...player, score: player.score + this.props.activeClue.value};
    const players = {...this.state.players, [player.playerID]: newPlayer};
    this.setState({
      activeClue: null,
      playedClues: playedClues,
      players: players,
      playerToAct: true,
      allowAnswers: false,
      revealAnswer: false,
      showActiveClue: false,
      status: 'Choose another clue.',
    });
    this.state.timerRef.current.reset();
    this.props.dismissActiveClue();
  }

  handleClueClick(clue) {
    let status = (
      <React.Fragment>
        Playing <span className="fw-bold">{clue.category}</span> for <span className="fw-bold">${clue.value}</span>...
      </React.Fragment>
    );
    this.props.selectClue(this.props.game.gameID, PLAYER_ID, clue.categoryID, clue.clueID);
    this.setState({
      playerToAct: false,
      status: status,
    });
    setTimeout(function() {
      this.setState({
        showActiveClue: true,
      });
      this.state.timerRef.current.start();
    }.bind(this), 1500);
  }

  render() {
    if (!this.props.game) {
      return (<div className="alert alert-primary fs-3 m-5 text-center" role="alert">Creating a new game, please wait...</div>);
    }
    const podiums = Object.values(this.state.players).map(player => <Podium key={player.playerID} name={player.name} score={player.score} />);
    return (
      <div id="game" className="game m-4">
        <CountdownTimer ref={this.state.timerRef}
                        seconds="10"
                        onTimeStarted={() => this.setState({allowAnswers: true})}
                        onTimeElapsed={() => this.revealAnswer()} />
        <Board gameID={this.props.game.gameID}
               categories={this.props.board.categories}
               handleClueClick={(clue) => this.handleClueClick(clue)}
               buzzIn={this.props.buzzIn}
               dismissCurrentClue={() => this.dismissCurrentClue()}
               {...this.state} />
        <StatusText action={this.state.playerToAct} text={this.state.status} />
        <div className="d-flex justify-content-center podium-container">
          {podiums}
        </div>
      </div>
    );
  }
}

export default Game;
