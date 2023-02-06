import React from 'react';
import {
  Badge,
  Box,
  Center,
  Flex,
  Heading,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Select,
  Spacer,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { faClipboardQuestion, faCrown, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { MILLISECONDS_PER_DAY, SORT_ARROW_ASCENDING, SORT_ARROW_DESCENDING } from '../../../constants.mjs';
import { formatDate, formatWeekday, getURLForContestant, range } from '../../../utils.mjs';
import Bold from '../common/Bold';
import Card from '../common/card/Card';
import Icon from '../common/Icon';

const BADGE_COLORS = ['blackAlpha', 'blue', 'cyan', 'green', 'pink', 'purple', 'orange', 'red', 'teal', 'yellow'];

const PLAYING_ROUND_PATTERN = /Playing the ((Double|Final) )?Jeopardy! Round:/gi;

function getColorForName(name, colors = BADGE_COLORS) {
  let hash = 0;
  range(name.length).forEach(i => hash += name.charCodeAt(i));
  return colors[hash % colors.length];
}

function scrollToTop() {
  const closeButton = document.getElementById('episode-browser-close-button');
  if (closeButton) {
    closeButton.scrollIntoView();
  }
}

class EpisodeBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reverseSort: false,
      selectedSeason: (props.seasonSummaries ? props.seasonSummaries[props.seasonSummaries.length - 1].seasonNumber : null),
      selectRef: React.createRef(),
    };
    this.onSelectedSeasonChanged = this.onSelectedSeasonChanged.bind(this);
    this.toggleSortOrder = this.toggleSortOrder.bind(this);
  }

  componentDidMount() {
    if (!this.props.seasonSummaries) {
      this.props.fetchSeasonSummaries();
    }
    if (this.state.selectedSeason) {
      this.props.fetchEpisodesForSeason(this.state.selectedSeason);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {

  }

  onSelectedSeasonChanged(event) {
    const seasonNumber = parseInt(event.target.value);
    this.setState({selectedSeason: seasonNumber});
    this.props.fetchEpisodesForSeason(seasonNumber);
  }

  toggleSortOrder() {
    this.setState({reverseSort: !this.state.reverseSort});
  }

  render() {
    let options = [];
    let placeholder = 'Loading...';
    if (this.props.seasonSummaries) {
      options = this.props.seasonSummaries.map(season => {
        const seasonNumber = season.seasonNumber;
        const seasonStartYear = new Date(season.seasonStartDate).getUTCFullYear();
        const seasonEnd = new Date(season.seasonEndDate);
        const seasonEndDiffDays = Math.ceil(Math.abs(new Date() - seasonEnd) / MILLISECONDS_PER_DAY);
        const seasonEndYear = (seasonEndDiffDays <= 7 ? 'present' : seasonEnd.getUTCFullYear());
        return (
          <option key={seasonNumber} value={seasonNumber}>
            Season {seasonNumber} ({seasonStartYear}&ndash;{seasonEndYear}, {season.episodeCount} episodes)
          </option>
        );
      });
      placeholder = '';
    }

    const seasonLoaded = this.props.selectedSeasonEpisodes?.seasonNumber === this.state.selectedSeason;
    let episodes = [];
    let contestantColors = {};
    if (seasonLoaded) {
      episodes = this.props.selectedSeasonEpisodes.episodes.map(episode => {
        let usedColors = new Set();
        let winnerContestantID = null;
        let highestScore = 0;
        episode.metadata?.contestants?.forEach(contestant => {
          const score = (episode.metadata?.hasOwnProperty('scores') ? episode.metadata.scores[contestant.contestantID.toString()]?.finalScore : 0) || 0;
          if (score > highestScore) {
            highestScore = score;
            winnerContestantID = contestant.contestantID;
          }
        });
        return (
          <Tr key={episode.episodeNumber} fontSize="lg">
            <Td whiteSpace="nowrap">
              <Flex direction="row" title={`Episode #${episode.episodeNumber}`}>
                <Box>
                  <Text fontSize="md">{formatWeekday(episode.airDate)},</Text>
                  <Text>{formatDate(episode.airDate)}</Text>
                </Box>
                {(episode.hasInvalidRounds || episode.hasUnrevealedClues) && (
                  <React.Fragment>
                    <Spacer minW="20px" />
                    <Center>
                      <Icon id={`episode-icon-${episode.episodeNumber}`} clickable={false}
                            color={episode.hasInvalidRounds ? 'orange' : 'inherit'}
                            icon={episode.hasInvalidRounds ? faTriangleExclamation : faClipboardQuestion}
                            title={episode.hasInvalidRounds ? 'This episode is missing one or more entire rounds.' : 'This episode has unrevealed clues.'} />
                    </Center>
                  </React.Fragment>
                )}
              </Flex>
            </Td>
            <Td wordBreak="break-word">{episode.metadata?.comments}</Td>
            <Td userSelect="none">
              {episode.metadata?.contestants?.map(contestant => {
                const contestantID = contestant.contestantID;
                let name = contestant.name || contestant.rawText;
                let shortName;
                if (name.startsWith('Playing')) {
                  shortName = name.replaceAll(PLAYING_ROUND_PATTERN, '').trim();
                } else {
                  shortName = name;
                }
                shortName = shortName.split(/\s+/)[0];
                let color;
                if (contestantColors.hasOwnProperty(contestantID)) {
                  color = contestantColors[contestantID];
                } else {
                  color = getColorForName(name, BADGE_COLORS.filter(color => !usedColors.has(color)));
                  contestantColors[contestantID] = color;
                }
                usedColors.add(color);
                return (
                  <Link key={contestantID} href={getURLForContestant(contestantID)} isExternal>
                    <Badge borderRadius={10} colorScheme={color} mx={1} px={2} title={name}>
                      {shortName}
                      {contestantID === winnerContestantID && (
                        <Text as="span" ml={1}>
                          <Icon id={`winner-${winnerContestantID}`} icon={faCrown} title="Champion" clickable={false} />
                        </Text>
                      )}
                    </Badge>
                  </Link>
                );
              })}
            </Td>
          </Tr>
        );
      });
      if (this.state.reverseSort) {
        episodes.reverse();
      }
    } else {
      episodes.push((
        <Tr key="loading" fontSize="lg">
          <Td colSpan={3} fontStyle="italic" textAlign="center">Loading...</Td>
        </Tr>
      ));
    }

    const sortArrow = (this.state.reverseSort ? SORT_ARROW_DESCENDING : SORT_ARROW_ASCENDING);

    return (
      <Modal id="episode-browser" initialFocusRef={this.state.selectRef} isOpen={true} onClose={this.props.modals.episodeBrowser.close} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton id="episode-browser-close-button" />
          <ModalBody p={0}>
            <Card className="game-settings" px={10} py={6} textAlign="center">
              <Heading mb={10}>Episode Browser</Heading>
              <Center>
                <Select focusBorderColor="jeopardyeBlue.500" minW="100px" w="auto" size="lg" value={this.state.selectedSeason}
                        onChange={this.onSelectedSeasonChanged} placeholder={placeholder} className="hover-pointer"
                        ref={this.state.selectRef}>
                  {options}
                </Select>
              </Center>
              <Table my={10} variant="striped">
                <Thead>
                  <Tr>
                    <Th cursor="default" userSelect="none">
                      Air Date
                      <Text as="span" className="hover-pointer" fontSize="xl" pl={2} onClick={this.toggleSortOrder}>{sortArrow}</Text>
                    </Th>
                    <Th cursor="default" userSelect="none" width="50%">Comments</Th>
                    <Th cursor="default" userSelect="none">Contestants</Th>
                  </Tr>
                </Thead>
                <Tbody fontSize="lg">
                  {episodes}
                </Tbody>
              </Table>
              {seasonLoaded && (
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

export default EpisodeBrowser;
