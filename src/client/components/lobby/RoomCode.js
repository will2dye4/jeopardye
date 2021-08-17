import React from 'react';
import { useClipboard, Text } from '@chakra-ui/react';
import Card from '../common/card/Card';
import CardHeader from '../common/card/CardHeader';

const COPY_TOAST_ID = 'link-copied-toast';

async function copyCodeToClipboard(onCopy, toast) {
  onCopy();
  if (!toast.isActive(COPY_TOAST_ID)) {
    toast({
      id: COPY_TOAST_ID,
      position: 'top',
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
            onClick={() => copyCodeToClipboard(onCopy, props.toast)}>
        {props.code}
      </Text>
    </Card>
  );
}

export default RoomCode;
