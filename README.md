# Jeopardye

Jeopardye is a trivia game that you can play with your friends.

## Installation

Jeopardye is a React app and a Node API server backed by a MongoDB database. The installation instructions
below assume macOS, but similar steps should work for Linux.

### Prerequisites

Install dependencies.

```
$ brew install node
$ brew install yarn
$ brew tap mongodb/brew
$ brew install mongodb-community
```

If hosting the app yourself, you may also choose to install nginx (or the Web server of your choice).

```
brew install nginx
```

Start MongoDB.

```
brew services start mongodb-community
```

**NOTE:** If installing on an M1 Mac, you will need to run `softwareupdate --install-rosetta`
before starting MongoDB.

### Installation Instructions

```
$ git clone https://github.com/will2dye4/jeopardye.git
$ cd jeopardye
$ yarn install
```

## Running the App and Server

This section assumes you have followed the installation instructions above.

To start the server (on port 3333 by default):

```
yarn server
```

To start the webapp in development mode (on port 3000 by default):

```
yarn start
```

## Configuration

The file [`src/config.json.example`](./src/config.json.example) contains an example of the configuration for the app.
This file should be copied to `src/config.json` and updated with the correct values for your environment.

In order to become an administrator in your instance of the app, you will need to first start the app and server
as described in the previous section. Open the app in a browser and create a player by clicking the `Enter Room Code`
button. Using the server logs, determine the player ID for the player you just created. Then, edit `src/config.json`
to add your player ID to the `admin.playerIDs` section. Restart the app and server for your changes to take effect.

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits. You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode. See the section about
[running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder. It correctly bundles React in production mode
and optimizes the build for the best performance.

The build is minified and the filenames include the hashes. Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn server`

Runs the server at `http://localhost:3333`. Expects MongoDB to be running.

## CLI

There is a command-line interface (`cli/jeopardye.py`) for managing a running instance of the Jeopardye app.
The CLI assumes that the app has already been configured to run in a server such as nginx.

The CLI supports the following commands:
* `deploy` - fetch latest changes and deploy the app and the server
* `deploy app` - fetch latest changes and deploy the app only
* `deploy server` - fetch latest changes and deploy the server only
* `fetch` - fetch latest changes
* `logs` - show logs from the API server
* `server pid` - print the PID of the API server process
* `server restart` - restart the API server
* `server start` - start the API server
* `server stop` - stop the API server
* `version` - print the current version number
