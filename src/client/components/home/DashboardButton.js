import React from 'react';
import { Badge } from '@chakra-ui/react';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import ActionIcon from '../common/ActionIcon';

function DashboardButton(props) {
  const title = 'Show admin dashboard';
  return (
    <Badge variant="solid" bg="white" color="black" borderRadius="full" boxShadow="dark-lg" px={3} py={2} fontSize="xl"
           userSelect="none" title={title} className="hover-pointer" onClick={props.adminDashboard.open}>
      <ActionIcon id="dashboard" icon={faTools} title={title} />
    </Badge>
  );
}

export default DashboardButton;
