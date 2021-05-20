import React from 'react';

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
    const rowClasses = 'row ' + (largeLabel ? 'w-100' : 'w-75');
    const labelColumnClasses = 'p-2 ' + (largeLabel ? 'col-8' : 'col');
    const inputColumnClasses = (largeLabel ? 'col' : 'col-8');

    let inputClasses = 'form-control form-control-lg w-100';
    if (this.state.invalid) {
      inputClasses += ' is-invalid';
    }

    return (
      <div className={rowClasses}>
        <div className={labelColumnClasses}>
          <label htmlFor={this.props.id} className="form-label">{this.props.label}</label>
        </div>
        <div className={inputColumnClasses}>
          <input id={this.props.id} type="text" value={this.state.value} className={inputClasses}
                 autoFocus={true} onChange={this.handleChange} onKeyUp={this.handleKeyUp} />
        </div>
        <div className="col p-1">
          <button type="submit" className="btn btn-primary" onClick={this.handleSubmit}>
            {this.props.submitText || 'Submit'}
          </button>
        </div>
      </div>
    );
  }
}

export default StatusBarInput;
