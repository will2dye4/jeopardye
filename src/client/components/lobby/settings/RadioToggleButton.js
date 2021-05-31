import React from 'react';
import { Button } from '@chakra-ui/react';

function RadioToggleButton(props) {
  const id = `${props.name}-${props.value}`;
  const variant = (props.checked ? 'solid' : 'outline');
  return (
    <Button className="radio-toggle-button" colorScheme="jeopardyBlue" variant={variant}
            _hover={{bg: 'jeopardyBlue.500', borderColor: 'jeopardyBlue.500', color: 'white'}}
            onClick={() => document.getElementById(id).click()}>
      <input type="radio"
             className="btn-check"
             autoComplete="off"
             id={id}
             name={props.name}
             value={props.value}
             checked={props.checked}
             onChange={props.onChange} />
      <label className="hover-pointer" htmlFor={id}>{props.label}</label>
    </Button>
  );
}

export default RadioToggleButton;
