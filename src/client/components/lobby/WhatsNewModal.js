import React from 'react';
import {
  Box,
  Center,
  Divider,
  GridItem,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import {
  faBullhorn,
  faCalendarCheck,
  faComments,
  faGavel,
  faHistory,
  faListUl,
  faLowVision,
  faMessage,
  faRankingStar,
} from '@fortawesome/free-solid-svg-icons';
import Bold from '../common/Bold';
import Card from '../common/card/Card';
import GridRow from '../common/GridRow';
import Icon from '../common/Icon';

const NEW_FEATURES = [
  {
    id: 'new-game-modes',
    icon: faCalendarCheck,
    heading: 'New Game Modes',
    description: (
      'You can now play a random game from a selected season or date range, or even a specific game from a selected date. ' +
      'You can also build a customized round by searching the database of available categories and choosing the ones you want to play.'
    ),
  },
  {
    id: 'final-round',
    icon: faRankingStar,
    heading: 'Final Round',
    description: (
      <React.Fragment>
        <Text as="span" fontStyle="italic">Finally</Text> (get it?), you can now play games with a final round! The scores
        can change in the blink of an eye as all players make their wagers and then attempt to answer the same clue. Be sure
        to wager wisely! (<Bold>NOTE:</Bold> Players who finish the penultimate round with a score of zero or below are not
        allowed to participate in the final round.)
      </React.Fragment>
    ),
  },
  {
    id: 'episode-browser',
    icon: faListUl,
    heading: 'Episode Browser',
    description: (
      'The new Episode Browser shows a summary of all archived episodes for the selected season, including the air date, ' +
      'contestants, and any notes about the episode. Clicking on an episode\'s air date reveals the categories for each round of the game.'
    ),
  },
  {
    id: 'room-history',
    icon: faHistory,
    heading: 'Room History',
    description: (
      'See a summary of all past games for the room you are currently in, including the date, duration, and scores. ' +
      'You can also see the current champion\'s winning streak, which was never visible anywhere before.'
    ),
  },
  {
    id: 'clue-context',
    icon: faComments,
    heading: 'Category & Clue Context',
    description: (
      <React.Fragment>
        The Episode Browser and also the game board now show icons indicating when a category has comments, typically
        the host describing the clue or answer format for that category.
        Hover over the <Text as="span" ml={1} mr={2}><Icon id="comments-example-icon" icon={faMessage} clickable={false} /></Text>
        icon to see the comments. Another new icon, <Text as="span" ml={1} mr={2}><Icon id="context-example-icon" icon={faLowVision} clickable={false} /></Text>
        indicates when a clue has missing context, for example, an audio clip or image that was not archived.
      </React.Fragment>
    ),
  },
  {
    id: 'improved-answer-eval',
    icon: faGavel,
    heading: 'Improved Answer Evaluation',
    description: (
      'The way answers are evaluated for correctness has (hopefully!) been made better in a couple of ways. ' +
      'In general, last names will now be accepted in place of full names, so you can answer "Shakespeare" when the ' +
      'correct answer is "William Shakespeare"—but be careful about ambiguous last names where the host might need a ' +
      'more specific answer! You can also now answer with commonly-recognized nicknames and initials, such as "JFK" ' +
      'instead of "John F. Kennedy."'
    ),
  },
  {
    id: 'whats-new-modal',
    icon: faBullhorn,
    heading: 'What\'s New Modal',
    description: (
      'Explore and learn about the most exciting new features in the latest version. Large, blue-colored icons are coupled with ' +
      'descriptive text explaining what\'s new and how to use it. (You\'re looking at it now!)'
    ),
  },
];

function WhatsNewModal(props) {
  return (
    <Modal id="whats-new-modal" isOpen={true} onClose={props.modals.whatsNew.close} size="5xl">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton id="whats-new-modal-close-button" />
        <ModalBody p={0} cursor="default" userSelect="none">
          <Card className="game-settings" px={10} py={6} textAlign="center">
            <Heading mb={10}>What's New in v2</Heading>
            <Box borderColor="jeopardyeBlue.500" borderRadius={10} borderWidth="3px" backgroundColor="gray.200" p={3} mb={10} mx={10}>
              <Text fontWeight="bold" py={2}>February 2023</Text>
              <Center pb={2}><Divider borderColor="jeopardyeBlue.500" borderWidth="1px" w="30%" /></Center>
              <Text mx={10} pb={2} align="center">
                The "whole team" at <Bold>Jeopardye!</Bold> has been "hard at work" to bring v2 of the game to life, and it's finally here!
                Here's a quick look at a few of the new features we've added to the classic trivia game you already know and love.
              </Text>
            </Box>
            {NEW_FEATURES.map(feature => (
              <Center key={feature.id}>
                <GridRow cols={5} gap={8} m={4} w="80%">
                  <GridItem>
                    <Center h="100%">
                      <Text color="jeopardyeBlue.500" fontSize="4xl">
                        <Icon id={`whats-new-${feature.id}-icon`} icon={feature.icon} clickable={false} title={feature.heading} />
                      </Text>
                    </Center>
                  </GridItem>
                  <GridItem colSpan={4} textAlign="left">
                    <Heading size="lg" pb={1}>{feature.heading}</Heading>
                    <Text fontSize="lg">{feature.description}</Text>
                  </GridItem>
                </GridRow>
              </Center>
            ))}
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default WhatsNewModal;
