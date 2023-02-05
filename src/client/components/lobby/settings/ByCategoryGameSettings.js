import React from 'react';
import { Flex, VStack } from '@chakra-ui/react';
import CategoryAutoComplete from './CategoryAutoComplete';
import { MIN_CATEGORY_SEARCH_TERM_LENGTH } from '../../../../constants.mjs';
import Bold from '../../common/Bold';
import GameSetting from './GameSetting';
import SelectedCategoryList from './SelectedCategoryList';

const DEFAULT_HELPER_TEXT = `categories by searching for them by name. You must type at least ${MIN_CATEGORY_SEARCH_TERM_LENGTH} letters to see results.`;

function ByCategoryGameSettings(props) {
  let helperText;
  if (props.disabled) {
    helperText = (
      <React.Fragment>
        Browse {DEFAULT_HELPER_TEXT}
        <br /><br />
        <Bold>NOTE:</Bold> You can browse the list of available categories, but only the host can make changes to the currently selected categories.
      </React.Fragment>
    );
  } else {
    helperText = `Select ${DEFAULT_HELPER_TEXT}`;
  }

  return (
    <React.Fragment>
      <GameSetting cols={4} label="Category Selection" helperText={helperText}>
        <Flex direction="row" pt={0} pb={3} w="75%">
          <VStack alignItems="left" w="100%">
            <CategoryAutoComplete disabled={props.disabled} categoryStats={props.categoryStats} search={props.searchCategorySummaries}
                                  searchResults={props.searchResults} selectedCategories={props.selectedCategories}
                                  onCategorySelected={props.onCategorySelected} />
            <SelectedCategoryList disabled={props.disabled} selectedCategories={props.selectedCategories} onCategoryRemoved={props.onCategoryRemoved} />
          </VStack>
        </Flex>
      </GameSetting>
    </React.Fragment>
  );
}

export default ByCategoryGameSettings;
