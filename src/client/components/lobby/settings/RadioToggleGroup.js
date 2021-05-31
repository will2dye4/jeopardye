import React from 'react';
import { SimpleGrid } from '@chakra-ui/react';
import RadioToggleButton from './RadioToggleButton';

function RadioToggleGroup(props) {
  return (
    <SimpleGrid columns={props.options.length} w="100%">
      {props.options.map(option => {
        const label = (typeof option === 'object' ? option.label : option);
        const value = (typeof option === 'object' ? option.value : option);
        return <RadioToggleButton key={value} value={value} checked={props.currentValue === value}
                                  name={props.name} label={label} onChange={props.onChange} />;
      })}
    </SimpleGrid>
  );
}

export default RadioToggleGroup;
