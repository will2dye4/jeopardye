import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import './index.css';
import { GameConnector } from './client/components/GameConnector';
import { store } from './client/store/data_store';
import reportWebVitals from './reportWebVitals';

const theme = extendTheme({
  colors: {
    jeopardyBlue: {
      50: '#1D08A3',
      500: '#1D08A3',
      600: '#0D0273',
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <GameConnector />
      </ChakraProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
