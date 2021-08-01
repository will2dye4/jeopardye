import moment from 'moment';
import React from 'react';
import {
  Flex,
  Link, Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Emoji, SORT_ARROW_DESCENDING } from '../../../constants.mjs';

function Players(props) {
  let { more, page, players, total } = props.allPlayers;
  players = players || [];
  return (
    <React.Fragment>
      <Flex direction="row" align="center" w="100%">
        <Flex direction="row" align="center" my={2}>
          <Text fontSize="lg" fontWeight="bold" ml={5} mr={4}>Active</Text>
          <Select focusBorderColor="jeopardyBlue.500" minW="100px" value={props.activeFilter} onChange={props.onActiveFilterChanged}>
            {['all', 'yes', 'no'].map(activeFilter =>
              <option key={activeFilter} value={activeFilter === 'all' ? '' : (activeFilter === 'yes')}>{activeFilter}</option>
            )}
          </Select>
        </Flex>
        <Text align="left" fontSize="lg" fontStyle="italic" ml={12} mr={5}>Showing {players.length} of {total}</Text>
      </Flex>
      <Table my={4} variant="striped">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Joined</Th>
            <Th>Last Connected <Text as="span" fontSize="lg" pl={1}>{SORT_ARROW_DESCENDING}</Text></Th>
            <Th>Active</Th>
          </Tr>
        </Thead>
        <Tbody fontSize="lg">
          {players.map(player =>
            (
              <Tr key={player.playerID}>
                <Td>{player.name}</Td>
                <Td>{moment(player.createdTime).fromNow()}</Td>
                <Td>{moment(player.lastConnectionTime).fromNow()}</Td>
                <Td>{player.active ? `${Emoji.CHECK_MARK} Yes` : `${Emoji.CROSS_MARK} No`}</Td>
              </Tr>
            )
          )}
        </Tbody>
      </Table>
      {total === 0 && <Text className="empty-list" fontStyle="italic" textAlign="center">No players to show</Text>}
      {more && <Link color="jeopardyBlue.500" onClick={() => props.fetchPlayers(props.activeFilter, page + 1)}>Load More</Link>}
    </React.Fragment>
  );
}

export default Players;
