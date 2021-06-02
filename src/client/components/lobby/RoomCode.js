import React from 'react';
import { createStandaloneToast, Text } from '@chakra-ui/react';
import JEOPARDYE_THEME from '../../theme';
import { copyToClipboard } from '../../utils';
import Card from '../common/card/Card';
import CardHeader from '../common/card/CardHeader';

const BASE_URL = 'http://localhost:3000';
const COPY_TOAST_ID = 'link-copied-toast';

const toast = createStandaloneToast({theme: JEOPARDYE_THEME});

async function copyCodeToClipboard(code) {
  await copyToClipboard(`${BASE_URL}/p/${code}`);
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
  return (
    <Card mb={5} textAlign="center">
      <CardHeader>Room Code</CardHeader>
      <Text className="room-code hover-blue hover-pointer" py={3} title="Click to copy link"
            onClick={() => copyCodeToClipboard(props.code)}>
        {props.code}
      </Text>
    </Card>
  );
}

export default RoomCode;
