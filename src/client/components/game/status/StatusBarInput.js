import React from 'react';
import { Button, Flex, Input, InputGroup, InputLeftElement, Text } from '@chakra-ui/react';

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
    if (event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      event.stopPropagation();
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
    const labelSize = this.props.labelSize || (this.props.label.length < 12 ? 'sm' : (this.props.label.length < 26 ? 'md' : 'lg'));
    const width = (labelSize === 'lg' ? '100%' : (labelSize === 'md' ? '90%' : '75%'));
    const inputWidth = (labelSize === 'lg' ? '12%' : '100%');
    const minLabelWidth = (labelSize === 'sm' ? 120 : 260);
    const inputProps = {
      id: this.props.id,
      value: this.state.value,
      isInvalid: this.state.invalid,
      bg: 'white',
      mr: 8,
      focusBorderColor: 'jeopardyBlue.500',
      autoFocus: true,
      onChange: this.handleChange,
      onKeyUp: this.handleKeyUp,
    };
    let input;
    if (this.props.leftElement) {
      input = (
        <InputGroup size="lg" w={inputWidth}>
          <InputLeftElement pointerEvents="none" color="jeopardyBlue.500" fontSize="1em" w={8}>
            {this.props.leftElement}
          </InputLeftElement>
          <Input sx={{paddingStart: 7, paddingInlineStart: 7}} {...inputProps} />
        </InputGroup>
      );
    } else {
      input = <Input size="lg" w={inputWidth} {...inputProps} />;
    }
    return (
      <Flex align="center" justify="center" textAlign="center" px={4} w={width}>
        <Text as="label" htmlFor={this.props.id} minWidth={minLabelWidth} mr={5}>{this.props.label}</Text>
        {input}
        <Button colorScheme="jeopardyBlue" size="lg" type="submit" onClick={this.handleSubmit}>
          {this.props.submitText || 'Submit'}
        </Button>
      </Flex>
    );
  }
}

export default StatusBarInput;
