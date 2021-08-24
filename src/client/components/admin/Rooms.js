import moment from 'moment';
import React from 'react';
import {
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Emoji, SORT_ARROW_DESCENDING } from '../../../constants.mjs';

function Rooms(props) {
  let { more, page, playerNames, rooms, total } = props.rooms;
  rooms = rooms || [];
  return (
    <React.Fragment>
      <Text align="left" fontSize="lg" fontStyle="italic" ml={5} my={2}>Showing {rooms.length} of {total}</Text>
      <Table my={4} variant="striped">
        <Thead>
          <Tr>
            <Th>Room Code</Th>
            <Th>Owner</Th>
            <Th>Created <Text as="span" fontSize="lg" pl={1}>{SORT_ARROW_DESCENDING}</Text></Th>
            <Th>Active Game</Th>
            <Th>Total Players</Th>
            <Th>Kicked Players</Th>
            <Th>Total Games</Th>
          </Tr>
        </Thead>
        <Tbody fontSize="lg">
          {rooms.map(room =>
            (
              <Tr key={room.roomID}>
                <Td>{room.roomCode}</Td>
                <Td>{playerNames[room.ownerPlayerID]}</Td>
                <Td>{moment(room.createdTime).fromNow()}</Td>
                <Td>{room.currentGameID ? `${Emoji.CHECK_MARK} Yes` : `${Emoji.CROSS_MARK} No`}</Td>
                <Td>{room.playerIDs.length}</Td>
                <Td>{Object.keys(room.kickedPlayerIDs).length}</Td>
                <Td>{room.previousGameIDs.length}</Td>
              </Tr>
            )
          )}
        </Tbody>
      </Table>
      {total === 0 && <Text className="empty-list" fontStyle="italic" textAlign="center">No rooms to show</Text>}
      {more && <Link color="jeopardyeBlue.500" onClick={() => props.fetchRooms(page + 1)}>Load More</Link>}
    </React.Fragment>
  );
}

export default Rooms;
