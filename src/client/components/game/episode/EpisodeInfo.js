import React from 'react';
import {
  Divider,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { formatDate, formatWeekday } from '../../../../utils.mjs';
import Card from '../../common/card/Card';
import EpisodeContestants from './EpisodeContestants';
import EpisodeScores from './EpisodeScores';

function EpisodeInfo(props) {
  const metadata = props.gameState.episodeMetadata;
  let title;
  if (metadata.hasOwnProperty('title')) {
    title = metadata.title;
  } else {
    title = `Show #${metadata.episodeNumber} - ${formatWeekday(metadata.airDate)}, ${formatDate(metadata.airDate, true)}`
  }
  return (
    <Modal isOpen={true} closeOnEsc={true} closeOnOverlayClick={true}
           onClose={props.modals.episodeInfo.close} size="5xl">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody p={0}>
          <Card className="game-settings" px={10} py={6} textAlign="center">
            <Heading mb={3}>{title}</Heading>
            <Heading mb={8} size="lg">Season {metadata.seasonNumber}</Heading>
            {metadata.comments && <Text mb={3} size="2xl">{metadata.comments}</Text>}
            {metadata.contestants && (
              <React.Fragment>
                <Divider alignSelf="center" m={8} w="80%" />
                <EpisodeContestants contestants={metadata.contestants} scores={metadata.scores} />
                {metadata.scores && <EpisodeScores contestants={metadata.contestants} scores={metadata.scores} />}
              </React.Fragment>
            )}
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default EpisodeInfo;
