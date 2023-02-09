import React from 'react';
import {
  Box,
  Center,
  Heading,
  HStack,
  List,
  ListItem,
  PopoverBody,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { formatEpisodeTitle } from '../../utils';
import Icon from '../common/Icon';

class EpisodePopoverBody extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      categories: (props.selectedEpisodeCategories?.episodeID === props.episode.episodeID ? props.selectedEpisodeCategories : null),
    };
  }

  componentDidMount() {
    if (this.props.selectedEpisodeCategories?.episodeID !== this.props.episode.episodeID) {
      this.props.fetchEpisodeCategories(this.props.episode.episodeID);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.selectedEpisodeCategories !== this.props.selectedEpisodeCategories && !this.state.categories &&
        this.props.selectedEpisodeCategories?.episodeID === this.props.episode.episodeID) {
      this.setState({
        categories: this.props.selectedEpisodeCategories,
      });
    }
  }

  render() {
    const roundCategories = (roundName, round) => {
      return (
        <Box px={4} py={2} h="100%" cursor="default" textAlign="center" backgroundColor="gray.50" borderColor="jeopardyeBlue.500" borderWidth="2px" borderRadius={10}>
          <Text color="jeopardyeBlue.500" fontWeight="bold" pb={1} style={{fontVariant: 'small-caps'}}>{roundName} round categories</Text>
          <List spacing={1}>
            {Object.entries(round?.categories || {}).map(([categoryID, category]) => (
              <ListItem key={categoryID} fontSize="md">
                {category.name}
                {category.comments && (
                  <Text as="span" color="purple" fontSize="sm" pl={2}>
                    <Icon id={`category-comments-${categoryID}`} icon={faMessage} title={category.comments} clickable={false} />
                  </Text>
                )}
              </ListItem>
            ))}
            {!Object.keys(round?.categories || {}).length && <ListItem>This episode is missing<br />the {roundName} round.</ListItem>}
          </List>
        </Box>
      );
    };

    let categories;
    if (this.state.categories) {
      categories = (
        <VStack>
          <HStack>
            {roundCategories('single', this.state.categories?.rounds?.single)}
            <Spacer minW="30px" />
            {roundCategories('double', this.state.categories?.rounds?.double)}
          </HStack>
          <Spacer minH="10px" />
          <Box px={4} py={2} cursor="default" textAlign="center" backgroundColor="gray.50" borderColor="jeopardyeBlue.500" borderWidth="2px" borderRadius={10}>
            <Text color="jeopardyeBlue.500" fontWeight="bold" pb={1} style={{fontVariant: 'small-caps'}}>final round category</Text>
            {Object.entries(this.state.categories?.rounds?.final?.categories || {}).map(([categoryID, category]) => (
              <Text key={categoryID} fontSize="md">{category.name}</Text>
            ))}
            {!Object.keys(this.state.categories?.rounds?.final?.categories || {}).length && <Text>This episode is missing the final round.</Text>}
          </Box>
        </VStack>
      );
    } else {
      categories = <Text fontStyle="italic" py={2}>Loading...</Text>;
    }
    return (
      <PopoverBody borderRadius={10} backgroundColor="gray.100" px={3} py={3}>
        <Center>
          <VStack>
            <Heading px={4} py={2} cursor="default" size="md">
              {formatEpisodeTitle({...this.props.episode.metadata, episodeNumber: this.props.episode.episodeNumber})}
            </Heading>
            {categories}
          </VStack>
        </Center>
      </PopoverBody>
    );
  }
}

export default EpisodePopoverBody;
