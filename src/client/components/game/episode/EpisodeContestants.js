import React from 'react';
import {
  Box,
  Center,
  Flex,
  Heading,
  Link,
  Spacer,
  Text,
} from '@chakra-ui/react';
import { formatScore } from '../../../../utils.mjs';
import Bold from '../../common/Bold';

function EpisodeContestants(props) {
  return (
    <Box w="100%">
      <Heading mb={8} size="xl">Contestants</Heading>
      <Center>
        <Flex direction="row" w="100%">
          {props.contestants.map((contestant, i) => {
            let text;
            if (contestant.name) {
              const href = `https://j-archive.com/showplayer.php?player_id=${contestant.contestantID}`;
              text = (
                <React.Fragment>
                  <Bold><Link color="jeopardyeBlue.500" href={href} isExternal>{contestant.name}</Link></Bold>,
                  <Text>{contestant.description}</Text>
                </React.Fragment>
              );
            } else {
              text = (<Text>contestant.rawText</Text>);
            }
            let previousStreak;
            const score = props.scores[contestant.contestantID.toString()];
            if (score && score.hasOwnProperty('previousStreak')) {
              previousStreak = (
                <Box fontSize="md" mt={4}>
                  <Text><Bold>Previous Streak:</Bold> {score.previousStreak}</Text>
                  <Text><Bold>Previous Winnings:</Bold> {formatScore(score.previousWinnings)}</Text>
                </Box>
              );
            }
            return (
              <React.Fragment>
                <Box borderColor="jeopardyeBlue.500" borderRadius={10} borderWidth={3} key={contestant.contestantID} w="30%" p={3}>
                  {text}
                  {previousStreak}
                </Box>
                {i !== props.contestants.length - 1 && <Spacer />}
              </React.Fragment>
            );
          })}
        </Flex>
      </Center>
    </Box>
  );
}

export default EpisodeContestants;
