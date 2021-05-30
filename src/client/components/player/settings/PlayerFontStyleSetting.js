import React from 'react';
import { range } from '../../../../utils.mjs';
import { DEFAULT_FONT_STYLE } from '../../../../constants.mjs';

const FONT_STYLES = [
  DEFAULT_FONT_STYLE,
  'Shadows Into Light',
  'Caveat Brush',
  'Beth Ellen',
  'Homemade Apple',
  'Gloria Hallelujah',
  'Rock Salt',
  'Satisfy',
  'Sacramento',
  'Rancho',
  'Kaushan Script',
  'Rouge Script',
];

const STYLES_PER_ROW = 3;
const NUM_ROWS = FONT_STYLES.length / STYLES_PER_ROW;

function PlayerFontStyleSetting(props) {
  const rows = range(NUM_ROWS).map(i => {
    const choices = range(STYLES_PER_ROW).map(j => {
      const index = (i * STYLES_PER_ROW) + j;
      const font = FONT_STYLES[index];
      const style = {fontFamily: `"${font}", sans-serif`};
      let classes = 'col col-3 font-sample mx-3 mb-3 text-center';
      if (font === props.selectedStyle) {
        classes += ' font-sample-selected';
      }
      return (
        <div key={j} className={classes} style={style} title={font} onClick={() => props.onChange(font)}>
          <span className="font-sample-text">{props.name}</span>
        </div>
      );
    });
    return <div key={i} className="row">{choices}</div>;
  });
  return (
    <div className="row my-5">
      <div className="col col-2 my-1">
        <div className="form-label fw-bold mb-0">Font Style</div>
      </div>
      <div className="col">
        {rows}
      </div>
    </div>
  );
}

export default PlayerFontStyleSetting;
