import moment from 'moment';
import React from 'react';
import {
  Badge,
  Flex,
  HStack,
  Link,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { SORT_ARROW_DESCENDING } from '../../../constants.mjs';
import { RoomLinkRequestResolution } from '../../../models/roomLinkRequest.mjs';
import ActionIcon from '../common/ActionIcon';

function getResolveButtons(props, request) {
  if (request.resolution !== RoomLinkRequestResolution.UNRESOLVED) {
    return null;
  }
  return (
    <HStack pl={3} spacing={3}>
      <ActionIcon icon={faCheck} title="Approve" onClick={() => props.resolveRoomLinkRequest(request.requestID, RoomLinkRequestResolution.APPROVED)} />
      <ActionIcon icon={faTimes} title="Reject" onClick={() => props.resolveRoomLinkRequest(request.requestID, RoomLinkRequestResolution.REJECTED)} />
    </HStack>
  );
}

function RoomLinkRequests(props) {
  let { more, page, requests, total } = props.roomLinkRequests;
  requests = requests || [];
  return (
    <React.Fragment>
      <Flex direction="row" align="center" w="100%">
        <Flex direction="row" align="center" my={2}>
          <Text fontSize="lg" fontWeight="bold" ml={5} mr={4}>Resolution</Text>
          <Select focusBorderColor="jeopardyBlue.500" minW="100px" value={props.resolution} onChange={props.onResolutionChanged}>
            {['all'].concat(Object.values(RoomLinkRequestResolution).sort()).map(resolution =>
              <option key={resolution} value={resolution === 'all' ? '' : resolution}>{resolution}</option>
            )}
          </Select>
        </Flex>
        <Text align="left" fontSize="lg" fontStyle="italic" ml={12} mr={5}>Showing {requests.length} of {total}</Text>
      </Flex>
      <Table my={4} variant="striped">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Submitted <Text as="span" fontSize="lg" pl={1}>{SORT_ARROW_DESCENDING}</Text></Th>
            <Th>Resolution</Th>
            <Th>Room Code</Th>
          </Tr>
        </Thead>
        <Tbody fontSize="lg">
          {requests.map(request => {
            const color = {
              [RoomLinkRequestResolution.APPROVED]: 'green',
              [RoomLinkRequestResolution.REJECTED]: 'red',
              [RoomLinkRequestResolution.UNRESOLVED]: 'gray',
            }[request.resolution];
            return (
              <Tr key={request.requestID}>
                <Td>{request.name}</Td>
                <Td>{request.email}</Td>
                <Td>{moment(request.createdTime).fromNow()}</Td>
                <Td>
                  <Flex direction="row" w="100px">
                    <Badge colorScheme={color} userSelect="none">{request.resolution.toTitleCase()}</Badge>
                    {getResolveButtons(props, request)}
                  </Flex>
                </Td>
                <Td>{request.roomCode}</Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
      {total === 0 && <Text className="empty-list" fontStyle="italic" textAlign="center">No requests to show</Text>}
      {more && <Link color="jeopardyBlue.500"
                     onClick={() => props.fetchRoomLinkRequests(props.resolution, page + 1)}>Load More</Link>}
    </React.Fragment>
  );
}

export default RoomLinkRequests;
