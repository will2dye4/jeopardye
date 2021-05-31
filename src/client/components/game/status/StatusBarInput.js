import React from 'react';
import { Button, Flex, Input, Text } from '@chakra-ui/react';

class StatusBarInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.defaultValue || '',
      invalid: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleKeyUp(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  handleSubmit() {
    const value = this.state.value;
    if (!this.props.validate(value)) {
      this.setState({invalid: true});
    } else {
      this.props.onSubmit(value);
      this.setState({
        value: this.props.defaultValue || '',
        invalid: false,
      });
    }
  }

  render() {
    const largeLabel = this.props.largeLabel || false;
    const width = (largeLabel ? '100%' : '75%');
    const inputWidth = (largeLabel ? '10%' : '100%');
    return (
      <Flex align="center" justify="center" px={4} w={width}>
        <Text as="label" htmlFor={this.props.id} minWidth={120} mr={5}>{this.props.label}</Text>
        <Input id={this.props.id} value={this.state.value} isInvalid={this.state.invalid} size="lg" bg="white" mr={8} w={inputWidth}
               focusBorderColor="jeopardyBlue.500" autoFocus={true} onChange={this.handleChange} onKeyUp={this.handleKeyUp} />
        <Button colorScheme="jeopardyBlue" size="lg" type="submit" onClick={this.handleSubmit}>
          {this.props.submitText || 'Submit'}
        </Button>
      </Flex>
    );
  }
}

export default StatusBarInput;
