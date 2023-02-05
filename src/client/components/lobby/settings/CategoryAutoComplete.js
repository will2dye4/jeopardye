import React from 'react';
import { Text, VStack } from '@chakra-ui/react';
import { AutoComplete, AutoCompleteInput, AutoCompleteItem, AutoCompleteList } from '@choc-ui/chakra-autocomplete';
import { CATEGORIES_PER_ROUND, MIN_CATEGORY_SEARCH_TERM_LENGTH } from '../../../../constants.mjs';

const SEARCH_DELAY_MILLIS = 500;

class CategoryAutoComplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputRef: React.createRef(),
      searchTerm: '',
      searchResults: {},
    };
    this.onSearchTermChanged = this.onSearchTermChanged.bind(this);
  }

  componentDidMount() {
    if (this.state.searchTerm.length >= MIN_CATEGORY_SEARCH_TERM_LENGTH) {
      this.props.search(this.state.searchTerm);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.searchResults !== this.props.searchResults && this.props.searchResults.searchTerm === this.state.searchTerm) {
      this.setState({searchResults: this.props.searchResults});
      this.state.inputRef.current?.blur();
      this.state.inputRef.current?.focus();
    }
  }

  onSearchTermChanged(event) {
    const term = event.target.value;
    let newState = {searchTerm: term};
    if (term.length < MIN_CATEGORY_SEARCH_TERM_LENGTH) {
      newState.searchResults = {};
    } else {
      setTimeout(function() {
        if (this.state.searchTerm === term) {
          this.props.search(term);
        }
      }.bind(this), SEARCH_DELAY_MILLIS);
    }
    this.setState(newState);
  }

  render() {
    let placeholder = 'Search for a category...';
    if (this.props.categoryStats) {
      const categoryCount = this.props.categoryStats.categoryCount.toLocaleString();
      const episodeCount = this.props.categoryStats.episodeCount.toLocaleString();
      placeholder = `Search ${categoryCount} categories from ${episodeCount} episodes...`;
    }
    return (
      <AutoComplete onSelectOption={this.props.onCategorySelected} listAllValuesOnFocus openOnFocus>
        <AutoCompleteInput bg="white" focusBorderColor="jeopardyeBlue.500" size="lg" ml={2} mb={5} onChange={this.onSearchTermChanged}
                           placeholder={placeholder} value={this.state.searchTerm} ref={this.state.inputRef}
                           disabled={!this.props.disabled && this.props.selectedCategories.length === CATEGORIES_PER_ROUND} />
        <AutoCompleteList>
          {this.state.searchResults.categories?.map(category => {
            const { categoryID, episodeCount, name, revealedClueCount } = category;
            if (this.props.selectedCategories.map(category => category.categoryID).includes(categoryID)) {
              return null;
            }
            const categoryName = name.trim();
            const index = categoryName.toUpperCase().indexOf(this.state.searchTerm.toUpperCase());
            const before = categoryName.substring(0, index);
            const bold = (<Text as="span" bg="blue.100" fontWeight="bold">{categoryName.substring(index, index + this.state.searchTerm.length)}</Text>);
            const after = categoryName.substring(index + this.state.searchTerm.length);
            return (
              <AutoCompleteItem align="left" disabled={this.props.disabled} fontSize="lg" key={categoryID}
                                label={categoryName} value={categoryID}>
                <VStack align="left">
                  <Text>{before}{bold}{after}</Text>
                  <Text color="gray" fontStyle="italic" fontSize="sm" mt={0}>
                    {revealedClueCount} clues from {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
                  </Text>
                </VStack>
              </AutoCompleteItem>
            );
          })}
        </AutoCompleteList>
      </AutoComplete>
    );
  }
}

export default CategoryAutoComplete;
