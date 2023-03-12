import React from 'react';
import {
  Box,
  Center,
  Heading,
  Link,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { formatScore } from '@dyesoft/alea-core';
import { getURLForContestant } from '../../../../utils.mjs';
import Bold from '../../common/Bold';

function EpisodeContestants(props) {
  return (
    <Box w="100%">
      <Heading mb={8} size="xl">Contestants</Heading>
      <Center>
        <SimpleGrid columns={3} spacing={10} mb={5} w="100%">
          {props.contestants.map(contestant => {
            let text;
            if (contestant.name) {
              const href = getURLForContestant(contestant.contestantID);
              text = (
                <React.Fragment>
                  <Bold><Link color="jeopardyeBlue.500" href={href} isExternal>{contestant.name}</Link></Bold>,
                  <Text>{contestant.description}</Text>
                </React.Fragment>
              );
            } else {
              text = (<Text>{contestant.rawText}</Text>);
            }
            let previousStreak;
            const score = (props.scores && props.scores[contestant.contestantID.toString()]);
            if (score && score.hasOwnProperty('previousStreak')) {
              previousStreak = (
                <Box fontSize="md" mt={4}>
                  <Text><Bold>Previous Streak:</Bold> {score.previousStreak}</Text>
                  <Text><Bold>Previous Winnings:</Bold> {formatScore(score.previousWinnings)}</Text>
                </Box>
              );
            }
            return (
              <Box bg="gray.100" borderColor="jeopardyeBlue.500" borderRadius={10} borderWidth={3} p={3}
                   key={contestant.contestantID || contestant.rawText}>
                {text}
                {previousStreak}
              </Box>
            );
          })}
        </SimpleGrid>
      </Center>
    </Box>
  );
}

export default EpisodeContestants;
