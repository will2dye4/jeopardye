import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import GameHistoryEventDescription from './GameHistoryEventDescription';

function GameHistoryEventAccordion(props) {
  return (
    <Accordion allowToggle={true}>
      <AccordionItem border={0} userSelect="none">
        <h2>
          <AccordionButton fontSize="lg" p={0} textAlign="left" _hover={{background: 'inherit'}}>
            <Flex w="100%">
              <GameHistoryEventDescription className="hover-pointer" description={props.heading} isAccordion={false}
                                           showTimestamp={true} timestamp={props.timestamp} />
              <Spacer />
              <AccordionIcon />
            </Flex>
          </AccordionButton>
        </h2>
        <AccordionPanel cursor="default" fontSize="md" py={2}>
          {props.children}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

export default GameHistoryEventAccordion;
