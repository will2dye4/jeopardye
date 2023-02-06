import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Center,
  Heading,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { formatScore } from '../../../../utils.mjs';
import Bold from '../../common/Bold';

function EpisodeScores(props) {
  return (
    <Accordion allowToggle borderColor="gray.50" mt={8} w="100%">
      <AccordionItem>
        <AccordionButton display="block" px={2} py={0}>
          <Heading size="xl">Final Scores</Heading>
          <AccordionIcon position="relative" top="-33px" left="14%"/>
        </AccordionButton>
        <AccordionPanel p={0}>
          <Center>
            <SimpleGrid columns={3} spacing={10} my={6} w="100%">
              {props.contestants.map(contestant => {
                const score = props.scores[contestant.contestantID.toString()];
                let text;
                if (score) {
                  text = (
                    <React.Fragment>
                      <Bold>{formatScore(score.finalScore)}</Bold>
                      <Text fontSize="md">{score.finalScoreRemarks}</Text>
                    </React.Fragment>
                  );
                } else {
                  text = (<Text>Missing Final Scores</Text>);
                }
                return (
                  <Box borderColor="jeopardyeBlue.500" borderRadius={10} borderWidth={3} key={contestant.contestantID}
                       p={3}>
                    {text}
                  </Box>
                );
              })}
            </SimpleGrid>
          </Center>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

export default EpisodeScores;
