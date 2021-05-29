import React from 'react';
import './Common.css';
import Logo from './Logo';

function LogoPage(props) {
  return (
    <div id={props.id} className="d-flex flex-fill logo-page">
      <Logo />
      <div className="row logo-page-content">
        {props.children}
      </div>
    </div>
  );
}

export default LogoPage;
