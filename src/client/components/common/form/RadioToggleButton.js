import React from 'react';
import { Button } from '@chakra-ui/react';

function RadioToggleButton(props) {
  const id = `${props.name}-${props.value}`;
  const variant = (props.checked ? 'solid' : 'outline');
  const hoverStyle = (props.disabled ? null : {bg: 'jeopardyeBlue.500', borderColor: 'jeopardyeBlue.500', color: 'white'});
  return (
    <Button className="radio-toggle-button" colorScheme="jeopardyeBlue" disabled={props.disabled} variant={variant}
            _hover={hoverStyle} onClick={() => document.getElementById(id).click()}>
      <input type="radio"
             className="btn-check"
             autoComplete="off"
             id={id}
             name={props.name}
             value={props.value}
             checked={props.checked}
             disabled={props.disabled}
             onChange={props.onChange} />
      <label className={props.disabled ? 'hover-not-allowed' : 'hover-pointer'} htmlFor={id}>{props.label}</label>
    </Button>
  );
}

export default RadioToggleButton;
