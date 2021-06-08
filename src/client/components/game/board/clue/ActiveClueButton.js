import React from 'react';
import { Badge, Flex } from '@chakra-ui/react';
import Icon from '../../../common/Icon';

function ActiveClueButton(props) {
  let classes = 'active-clue-button';
  if (props.selectable) {
    classes += ' selectable-clue-button';
  }
  return (
    <Flex align="center">
      <Icon className={classes} id={props.id} icon={props.icon} title={props.title} />
      <Badge bg="white" color="jeopardyBlue.500" borderRadius="full" ml={1} px={1} fontSize="md">
        {props.badge}
      </Badge>
    </Flex>
  );
}

export default ActiveClueButton;
