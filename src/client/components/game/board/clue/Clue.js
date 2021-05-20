import React from 'react';

class Clue extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (!this.props.clue.played) {
      this.props.onClick(this);
    }
  }

  render() {
    let classes = 'clue-border p-2';
    let text = <br />;
    if (!this.props.clue.played && this.props.clue.value) {
      classes += ' active-clue hover-pointer';
      text = `$${this.props.clue.value}`;
    }
    return (
      <div className="border border-2 clue col fw-bold text-center user-select-none" onClick={this.handleClick}>
        <div className={classes}>{text}</div>
      </div>
    );
  }
}

export default Clue;
