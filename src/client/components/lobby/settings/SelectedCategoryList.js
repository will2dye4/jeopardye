import React from 'react';
import {Box, Flex, List, ListItem, Spacer, Text, VStack} from '@chakra-ui/react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { CATEGORIES_PER_ROUND } from '../../../../constants.mjs';
import ActionIcon from '../../common/ActionIcon';
import CardHeader from '../../common/card/CardHeader';
import Card from '../../common/card/Card';

function SelectedCategoryList(props) {
  let className = 'hover-yellow';
  let iconColor = 'jeopardyeBlue';
  let iconTitle = 'Remove';
  if (props.disabled) {
    className = 'hover-not-allowed';
    iconColor = 'gray';
    iconTitle = '';
  }
  return (
    <Box pl={2}>
      <Card className="player-list" fontSize="lg">
        <CardHeader>Selected Categories ({props.selectedCategories.length}/{CATEGORIES_PER_ROUND})</CardHeader>
        <List className="list-group">
          {props.selectedCategories.map(category => (
            <ListItem bg="gray.100" className="list-group-item" key={category.categoryID} py={1}>
              <Flex align="center">
                <VStack align="left">
                  <Text cursor="default">
                    {category.name}
                  </Text>
                  {!!category.revealedClueCount && (
                    <Text cursor="default" color="gray.800" fontStyle="italic" fontSize="sm" mt="0 !important">
                      {category.revealedClueCount} clues from {category.episodeCount} {category.episodeCount === 1 ? 'episode' : 'episodes'}
                    </Text>
                  )}
                </VStack>
                <Spacer minW={10} />
                <ActionIcon id={`remove-category-icon-${category.categoryID}`} icon={faXmark} title={iconTitle}
                            className={className} color={iconColor} clickable={!props.disabled}
                            onClick={() => !props.disabled && props.onCategoryRemoved(category.categoryID)} />
              </Flex>
            </ListItem>
          ))}
          {!props.selectedCategories.length && <ListItem key="empty" className="list-group-item empty-list">No Categories Selected</ListItem>}
        </List>
      </Card>
    </Box>
  );
}

export default SelectedCategoryList;
