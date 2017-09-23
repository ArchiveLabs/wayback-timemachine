import React, { Component } from 'react';
import './ExampleViz.css';

class ExampleViz extends Component {
  render() {

    var data = this.props.data || [];
    var resultEls = data.map((row) => {
      return <li>
        {JSON.stringify(row, null, 2)}
        <img src={row.screenshot_url} />
      </li>
    });
    return (
      <div className="ExampleViz">
        <h1>ExampleViz</h1>
        <ul>
          {resultEls}
        </ul>
      </div>
    );
  }
}

export default ExampleViz;
