import React from 'react';
import { Box, Flex, Divider, GridItem, Heading } from '@chakra-ui/react';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { formatScore } from '../../../../utils.mjs';
import GridRow from '../../common/GridRow';
import Icon from '../../common/Icon';

const FONT_SIZES = ['3xl', '2xl', 'xl', 'lg'];

function getFontSize(index) {
  return FONT_SIZES[Math.min(index, FONT_SIZES.length - 1)];
}

function RoundScores(props) {
  const { gameOver, places } = props.roundSummary;
  return (
    <Box>
      {Object.entries(places).map(([place, playerIDs], i) => {
        const fontSize = getFontSize(i);
        return playerIDs.map((playerID, j) => {
          const player = props.players[playerID];
          const name = player?.name || playerID;
          const pt = (j === 0 ? (i < 2 ? 6 : 3) : 2);
          const placeText = <React.Fragment>{place.substring(0, 1)}<sup>{place.substring(1, place.length)}</sup></React.Fragment>;

          return (
            <React.Fragment key={playerID}>
              <GridRow cols={3}>
                <GridItem mr={3} mt={2} pt={pt} color="jeopardyBlue.500" d="flex" alignItems="center" justifySelf="right">
                  {(j === 0 ? <Heading size={fontSize}>{placeText}</Heading> : <br />)}
                </GridItem>
                <GridItem colSpan={2} textAlign="left" ml={8} mt={2} pt={pt} d="flex" alignItems="center">
                  <Heading size={fontSize}>{name} ({formatScore(player?.score)})</Heading>
                  {gameOver && place === '1st' && (
                    <Heading color="jeopardyYellow.500" size={getFontSize(i + 2)} ml={3}>
                      <Icon id="winner-icon" icon={faCrown} title="Winner" clickable={false}/>
                    </Heading>
                  )}
                </GridItem>
              </GridRow>
              {i < Object.keys(places).length - 1 && j === playerIDs.length - 1 && (
                <Flex justify="center">
                  <Divider py={3} w="60%" opacity={1} borderBottomWidth={2} />
                </Flex>
              )}
            </React.Fragment>
          );
        });
      })}
    </Box>
  );
}

export default RoundScores;
