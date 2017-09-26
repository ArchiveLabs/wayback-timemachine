import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ExampleViz from './ExampleViz.js';
import CoverFlow from './CoverFlow.js';
import jQuery from 'jquery';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      searchValue: 'https://nytimes.com',
      results: [],
      isLoading: false,
      showLimit: 15,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    this.fetchData(this.refs.searchEl.value);
    event.preventDefault();
  }

  fetchData(searchValue) {
    // Remove https:// and http://
    searchValue = searchValue.replace('https://' , '');
    searchValue = searchValue.replace('http://' , '');

    this.setState({isLoading: true});

    // metadata
    jQuery.getJSON({
      //url: 'http://web.archive.org/cdx/search/cdx',
      url: 'https://archive.org/~richard/dev/cdx_sample.php',
      data: {
        url: searchValue,
        output: 'json',
        matchType: 'exact',
        filter: 'statuscode:200',
        collapse: 'timestamp:100000',
        limit: this.state.showLimit
      },
    }).then((data) => {
      this.setState({isLoading: false});

      // Remove first element from array (header fields)
      data.shift();

      // Example result
      // [
      //   "org,archive)/",
      //   "19970126045828",
      //   "http://www.archive.org:80/",
      //   "text/html",
      //   "200",
      //   "Q4YULN754FHV2U6Q5JUT6Q2P57WEWNNY",
      //   "1415"
      // ]

      function getScreenshotMicroservice(row) {
        // http://richard-dev.us.archive.org:8200/?url=www.google.com
        var baseUrl = 'http://richard-dev.us.archive.org:8200/';
        var url2 = row[2].replace(':80', '');
        var fullurl = encodeURIComponent(`http://web.archive.org/web/${row[1]}/${url2}`);
        return `${baseUrl}?url=${fullurl}`
      }

      var dataMapped = data.map(function(row) {
        var url = row[2].replace(':80', '');
        return {
          url: `https://web.archive.org/web/${row[1]}/${url}`,
          timestamp: row[1],
          original_url: row[2],
          content_type: row[3],
          response_code: row[4],
          screenshot_url: getScreenshotMicroservice(row)
        }
      });

      this.setState({results: dataMapped});
    });
  }

  render() {
    var loadingEl;
    if (this.state.isLoading) {
      loadingEl = <div style={{color:'white'}}>Loading...</div>;
    }

    return (
      <div className="App">
        <div className="">
          <form onSubmit={this.handleSubmit}>
            <input defaultValue={this.state.searchValue} onChange={this.handleSearchChange} ref="searchEl" />
            <input type="submit" />
            {loadingEl}
          </form>
          <CoverFlow data={this.state.results} />
        </div>
      </div>
    );
  }
}

export default App;
