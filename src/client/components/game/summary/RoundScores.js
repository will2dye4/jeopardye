import React from 'react';
import { Box, Flex, Divider, GridItem, Heading } from '@chakra-ui/react';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { comparePlayerNames, formatScore } from '@dyesoft/alea-core';
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
      {Object.entries(places).map(([place, players], i) => {
        const fontSize = getFontSize(i);
        return players.sort(comparePlayerNames).map((player, j) => {
          const pt = (j === 0 ? (i < 2 ? 6 : 3) : 2);
          let placeText = place;
          if (place !== 'Honorable Mention') {
            placeText = <React.Fragment>{place.substring(0, place.length - 2)}<sup>{place.substring(place.length - 2, place.length)}</sup></React.Fragment>;
          }

          return (
            <React.Fragment key={player.playerID}>
              <GridRow cols={3}>
                <GridItem mr={3} mt={2} pt={pt} color="jeopardyeBlue.500" display="flex" alignItems="center" justifySelf="right">
                  {(j === 0 ? <Heading size={fontSize}>{placeText}</Heading> : <br />)}
                </GridItem>
                <GridItem colSpan={2} textAlign="left" ml={8} mt={2} pt={pt} display="flex" alignItems="center">
                  <Heading size={fontSize}>{player.name} ({formatScore(player.score)})</Heading>
                  {gameOver && place === '1st' && (
                    <Heading color="jeopardyeYellow.500" size={getFontSize(i + 2)} ml={3}>
                      <Icon id="winner-icon" icon={faCrown} title="Champion" clickable={false} />
                    </Heading>
                  )}
                </GridItem>
              </GridRow>
              {i < Object.keys(places).length - 1 && j === players.length - 1 && (
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
