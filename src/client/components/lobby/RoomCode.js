import React from 'react';
import { createStandaloneToast, useClipboard, Text } from '@chakra-ui/react';
import JEOPARDYE_THEME from '../../theme';
import Card from '../common/card/Card';
import CardHeader from '../common/card/CardHeader';

const COPY_TOAST_ID = 'link-copied-toast';

const toast = createStandaloneToast({theme: JEOPARDYE_THEME});

async function copyCodeToClipboard(onCopy) {
  onCopy();
  if (!toast.isActive(COPY_TOAST_ID)) {
    toast({
      id: COPY_TOAST_ID,
      title: 'Link copied to clipboard.',
      status: 'success',
      isClosable: true,
    });
  }
}

function RoomCode(props) {
  const roomURL = `${window.location.origin}/p/${props.code}`;
  const { onCopy } = useClipboard(roomURL);
  return (
    <Card mb={5} textAlign="center">
      <CardHeader>Room Code</CardHeader>
      <Text className="room-code hover-blue hover-pointer" py={3} title="Click to copy link"
            onClick={() => copyCodeToClipboard(onCopy)}>
        {props.code}
      </Text>
    </Card>
  );
}

export default RoomCode;
