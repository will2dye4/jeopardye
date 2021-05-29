import React from 'react';

function PlayerFontStyleSetting(props) {
  return (
    <div className="row my-5">
      <div className="col col-2 my-1">
        <div className="form-label fw-bold mb-0">Font Style</div>
      </div>
      <div className="col">
        <div className="row">
          <div className="border col col-3 fs-2 font-sample font-style-dancing-script mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample font-style-shadows-into-light mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample font-style-patrick-hand mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
        </div>
        <div className="row">
          <div className="border col col-3 fs-2 font-sample font-style-satisfy mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample font-style-beth-ellen mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample font-style-gloria-hallelujah mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
        </div>
        <div className="row">
          <div className="border col col-3 fs-2 font-sample font-style-caveat-brush mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample font-style-homemade-apple mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample font-style-rock-salt mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
        </div>
        <div className="row">
          <div className="border col col-3 fs-2 font-sample font-style-sacramento mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
          <div className="border col col-3 fs-2 font-sample mx-3 mb-3 px-3 py-4 text-center">{props.name}</div>
        </div>
      </div>
    </div>
  );
}

export default PlayerFontStyleSetting;
