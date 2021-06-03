import React from 'react';
import { Badge, HStack, Text } from '@chakra-ui/react';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import Icon from '../../common/Icon';
import JoinGameDialog from './JoinGameDialog';

function SpectatorsBadge(props) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const onSubmit = () => {
    props.stopSpectating(props.gameState.playerID);
    props.joinGame(props.gameState.gameID, props.gameState.playerID);
    setIsDialogOpen(false);
  };
  const numSpectators = Object.keys(props.spectators).length;
  const title = (props.gameState.playerIsSpectating ? 'You are spectating' : `${numSpectators} spectator${numSpectators > 1 ? 's' : ''}`);
  let classes, joinDialog, onClick;
  if (props.gameState.playerIsSpectating) {
    classes = 'hover-pointer';
    joinDialog = <JoinGameDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={onSubmit} />;
    onClick = () => setIsDialogOpen(true);
  }
  return (
    <React.Fragment>
      <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={2} fontSize="lg"
             position="fixed" bottom="5" right="5" zIndex="1000" title={title} className={classes} onClick={onClick}>
        <HStack spacing="5px">
          <Icon id="spectators" icon={faEye} title={title} clickable={props.gameState.playerIsSpectating} />
          <Text>{numSpectators}</Text>
        </HStack>
      </Badge>
      {joinDialog}
    </React.Fragment>
  );
}

export default SpectatorsBadge;
