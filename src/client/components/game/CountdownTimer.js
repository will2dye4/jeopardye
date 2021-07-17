import React from 'react';
import { Progress, ProgressLabel } from '@chakra-ui/react';

function CountdownTimer(props) {
  const { paused, running, wagering, waiting, seconds } = props.timer;
  let label, value;
  let color = 'green';
  let fontColor = 'white';
  let animated = false;
  if (waiting) {
    animated = true;
    label = 'Waiting...'
    value = 100;
  } else {
    const answering = (props.showResponseTimer || props.gameState.isDailyDouble);
    color = (answering ? 'red' : 'purple');
    if (running || paused) {
      if (paused) {
        label = 'Paused';
      } else {
        let verb = 'Buzz';
        if (wagering) {
          verb = 'Wager';
        } else if (answering) {
          verb = 'Answer';
        }
        const secondsRemaining = Math.ceil(props.timer.value * seconds / 100);
        label = `${verb} in ${secondsRemaining}`;
      }
      value = props.timer.value;
      if (value < 52) {
        fontColor = 'black';
      }
    } else {
      value = 0;
    }
  }
  return (
    <Progress hasStripe={animated} isAnimated={animated} borderRadius="md" colorScheme={color} mb={3} height={30} value={value}>
      <ProgressLabel color={fontColor} cursor="default" fontSize="md" fontWeight="extrabold" userSelect="none">{label}</ProgressLabel>
    </Progress>
  );
}

export default CountdownTimer;
