import React from 'react';
import { Text } from '@chakra-ui/react';
import Card from '../common/card/Card';
import CardHeader from '../common/card/CardHeader';

function RoomCode(props) {
  return (
    <Card mb={5} textAlign="center">
      <CardHeader>Room Code</CardHeader>
      <Text className="room-code" py={3}>{props.code}</Text>
    </Card>
  );
}

export default RoomCode;
