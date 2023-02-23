import moment from 'moment';
import React from 'react';
import {
  Box,
  Center,
  Divider,
  Flex,
  GridItem,
  Heading,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { faCrown, faInfoCircle, faUserTie } from '@fortawesome/free-solid-svg-icons';
import {
  MILLISECONDS_PER_HOUR,
  MILLISECONDS_PER_MINUTE,
  SORT_ARROW_ASCENDING,
  SORT_ARROW_DESCENDING,
} from '../../../../constants.mjs';
import {comparePlayerNames, formatDate, formatScore, getCurrentPlaces} from '../../../../utils.mjs';
import { formatEpisodeTitle } from '../../../utils';
import Bold from '../../common/Bold';
import Card from '../../common/card/Card';
import Icon from '../../common/Icon';
import GridRow from "../../common/GridRow";

function scrollToTop() {
  const closeButton = document.getElementById('room-history-close-button');
  if (closeButton) {
    closeButton.scrollIntoView();
  }
}

class RoomHistory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reverseSort: false,
    };
    this.toggleSortOrder = this.toggleSortOrder.bind(this);
  }

  componentDidMount() {
    if (!this.props.roomHistory || this.props.roomHistory.roomID !== this.props.roomID) {
      this.props.fetchRoomHistory(this.props.roomID);
    }
  }

  toggleSortOrder() {
    this.setState({reverseSort: !this.state.reverseSort});
  }

  render() {
    const historyLoaded = this.props.roomHistory?.roomID === this.props.roomID;
    let games = [];
    let overview;
    if (historyLoaded) {
      games = this.props.roomHistory.previousGames.map(game => {
        let duration = <Text as="span" fontStyle="italic" textColor="gray.600">Unfinished</Text>;
        if (game.finishedTime) {
          duration = [];
          let diff = moment(game.finishedTime).diff(game.createdTime);
          if (diff >= MILLISECONDS_PER_HOUR) {
            const hours = Math.round(diff / MILLISECONDS_PER_HOUR);
            duration.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
            diff /= MILLISECONDS_PER_HOUR;
          }
          if (diff >= MILLISECONDS_PER_MINUTE) {
            const minutes = Math.round(diff / MILLISECONDS_PER_MINUTE);
            duration.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
          }
          if (!duration.length) {
            duration.push('< 1 minute');
          }
          duration = duration.join(', ');
        }
        const places = getCurrentPlaces(game, this.props.roomHistory.players);
        return (
          <Tr key={game.gameID} fontSize="lg">
            <Td whiteSpace="nowrap">
              <Flex direction="row">
                <Text>{formatDate(game.createdTime)}</Text>
              </Flex>
            </Td>
            <Td userSelect="none">
              {game.episodeMetadata && (
                <Center>
                  <Icon id={`episode-icon-${game.gameID}`} clickable={false}
                        icon={faInfoCircle}
                        title={formatEpisodeTitle(game.episodeMetadata)} />
                </Center>
              )}
            </Td>
            <Td userSelect="none">{duration}</Td>
            <Td textAlign="center">{game.numRounds}</Td>
            <Td userSelect="none">
              <Box>
                {Object.entries(places).map(([place, players], i) => {
                  return players.sort(comparePlayerNames).map((player, j) => {
                    const pt = 1;
                    let placeText = place;
                    if (place !== 'Honorable Mention') {
                      placeText = <React.Fragment>{place.substring(0, place.length - 2)}<sup>{place.substring(place.length - 2, place.length)}</sup></React.Fragment>;
                    }
                    return (
                      <React.Fragment key={player.playerID}>
                        <GridRow cols={4}>
                          <GridItem mr={3} mt={1} pt={pt} color="jeopardyeBlue.500" display="flex" alignItems="center" justifySelf="left">
                            {(j === 0 ? <Text fontWeight="bold" size="md">{placeText}</Text> : <br />)}
                          </GridItem>
                          <GridItem colSpan={3} textAlign="left" ml={0} mt={1} pt={pt} display="flex" alignItems="center">
                            <Text size="md">{player.name} ({formatScore(player.score)})</Text>
                            {game.finishedTime && place === '1st' && (
                              <Heading color="jeopardyeYellow.500" size="md" ml={3}>
                                <Icon id={`winner-icon-${game.gameID}`} icon={faCrown} title="Champion" clickable={false} />
                              </Heading>
                            )}
                          </GridItem>
                        </GridRow>
                        {i < Object.keys(places).length - 1 && j === players.length - 1 && (
                          <Flex justify="center">
                            <Divider py={1} w="60%" opacity={1} borderBottomWidth={2} />
                          </Flex>
                        )}
                      </React.Fragment>
                    );
                  });
                })}
              </Box>
            </Td>
          </Tr>
        );
      });
      if (this.state.reverseSort) {
        games.reverse();
      }
      const { createdTime, currentChampion, currentWinningStreak, ownerPlayerID, players } = this.props.roomHistory;
      const hostPlayerID = this.props.room?.hostPlayerID || this.props.roomHistory.hostPlayerID;
      const owner = players?.find(player => player.playerID === ownerPlayerID)?.name || ownerPlayerID;
      const host = players?.find(player => player.playerID === hostPlayerID)?.name || hostPlayerID;
      const champion = (currentChampion ? players?.find(player => player.playerID === currentChampion)?.name || currentChampion : <Text as="span" fontStyle="italic">None</Text>);
      overview = (
        <SimpleGrid columns={3} fontSize="xl">
          <Box>
            <Text><Bold>Room Created</Bold></Text>
            <Text>{formatDate(createdTime)} by {owner}</Text>
          </Box>
          <Box>
            <Text>
              <Bold>Current Host</Bold>
              <Text as="span" color="purple.500" ml={2}><Icon id="host-icon" icon={faUserTie} title="Host" clickable={false} /></Text>
            </Text>
            <Text>{host}</Text>
          </Box>
          <Box>
            <Text>
              <Bold>Current Champion</Bold>
              <Text as="span" color="jeopardyeYellow.500" ml={2}><Icon id="champion-icon" icon={faCrown} title="Champion" clickable={false} /></Text>
            </Text>
            <Text>{champion}</Text>
            {currentChampion && (<Text fontSize="sm" fontStyle="italic">Winning Streak: {currentWinningStreak}</Text>)}
          </Box>
        </SimpleGrid>
      );
    } else {
      games.push((
        <Tr key="loading" fontSize="lg">
          <Td colSpan={3} fontStyle="italic" textAlign="center">Loading...</Td>
        </Tr>
      ));
    }

    const sortArrow = (this.state.reverseSort ? SORT_ARROW_DESCENDING : SORT_ARROW_ASCENDING);

    return (
      <Modal id="room-history" isOpen={true} onClose={this.props.modals.roomHistory.close} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton id="room-history-close-button" />
          <ModalBody p={0} cursor="default" userSelect="none">
            <Card className="game-settings" px={10} py={6} textAlign="center">
              <Heading mb={10}>Game History for Room {this.props.room?.roomCode}</Heading>
              {overview}
              <Table my={10} variant="striped">
                <Thead>
                  <Tr>
                    <Th cursor="default" userSelect="none">
                      Created Date
                      <Text as="span" className="hover-pointer" fontSize="xl" pl={2} onClick={this.toggleSortOrder}>{sortArrow}</Text>
                    </Th>
                    <Th cursor="default" userSelect="none" textAlign="center">Episode Info</Th>
                    <Th cursor="default" userSelect="none">Duration</Th>
                    <Th cursor="default" userSelect="none" textAlign="center" title="The number of rounds does not include the final round." whiteSpace="nowrap"># Rounds</Th>
                    <Th cursor="default" userSelect="none" width="35%">Scores</Th>
                  </Tr>
                </Thead>
                <Tbody fontSize="lg">
                  {games}
                </Tbody>
              </Table>
              {historyLoaded && (
                <Link color="jeopardyeBlue.500" className="hover-pointer" _hover={{}} onClick={scrollToTop}>
                  <Text as="span" fontSize="3xl" px={2}>{SORT_ARROW_ASCENDING}</Text>
                  <Bold>back to top</Bold>
                  <Text as="span" fontSize="3xl" px={2}>{SORT_ARROW_ASCENDING}</Text>
                </Link>
              )}
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export default RoomHistory;
