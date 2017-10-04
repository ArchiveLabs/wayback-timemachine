import React, { Component } from 'react';
import './App.css';
import ExampleViz from './ExampleViz.js';
import CoverFlow from './CoverFlow.js';
import jQuery from 'jquery';

function updateUrlParameter(value) {
  window.history.replaceState("", "", "?q=" + value);
}

// https://stackoverflow.com/a/5158301
function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function getScreenshotMicroservice(row) {
  // http://richard-dev.us.archive.org:8200/?url=www.google.com
  var baseUrl = 'http://richard-dev.us.archive.org:8200/';
  var url2 = row[2].replace(':80', '');
  var fullurl = encodeURIComponent(`http://web.archive.org/web/${row[1]}if_/${url2}`);
  return `${baseUrl}?url=${fullurl}`
}

function getScreenshotMicroserviceCors(row) {
  var url = encodeURIComponent(getScreenshotMicroservice(row));
  return `//archive.org/~richard/dev/cors.php?url=${url}`
}

function getScreenshotIA(row) {
  // http://crawl-services.us.archive.org:8200/wayback?url=http:/www.hubspot.com/&timestamp=20160927
  // `http://crawl-services.us.archive.org:8200/wayback?url=http://iskme.org/&timestamp=2017&width=128&height=96&format=jpeg`
  var baseUrl = 'http://crawl-services.us.archive.org:8200/wayback';
  var url2 = encodeURIComponent(row[2].replace(':80', ''));
  return `${baseUrl}?timestamp=${row[1]}&url=${url2}&format=jpeg`
}

function getScreenshotIACors(row) {
  var url = encodeURIComponent(getScreenshotIA(row));
  return `//archive.org/~richard/dev/cors.php?url=${url}`
}

var getScreenshot = getScreenshotIA;

// Processes data returned from the server
// eg filter out known defects (like craigslist)
function processData(data) {
  return data.reduce(function(accumulator, row) {
    console.log(row);

    // craiglist data that's not actually craigslist
    if (row.url == 'https://web.archive.org/web/20130706025735/http://www.craigslist.org/')
      return accumulator;

    accumulator.push(row);
    return accumulator;
  }, []);
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchValue: getParameterByName('q') || '',
      results: [],
      isLoading: false,
      showLimit: 25,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    if (this.refs.searchEl.value)
      this.fetchData(this.refs.searchEl.value);

    this.refs.searchEl.focus();
  }

  handleSubmit(event) {
    this.fetchData(this.refs.searchEl.value);
    updateUrlParameter(this.refs.searchEl.value);
    event.preventDefault();

    // HACK there is a bug, maybe with the React+THREE.js integration where images
    // are duplicating. It might be related to react's lifecyle or render.
    // As a work-around we do a full page load on submit.
    window.location.reload();
  }

  fetchData(searchValue) {
    // Remove https:// and http://
    searchValue = searchValue.replace('https://' , '');
    searchValue = searchValue.replace('http://' , '');

    this.setState({isLoading: true});

    // metadata
    jQuery.getJSON({
      url: 'http://web.archive.org/cdx/search/cdx',
      //url: 'https://archive.org/~richard/dev/cdx_sample.php',
      data: {
        url: searchValue,
        output: 'json',
        matchType: 'exact',
        filter: 'statuscode:200',
        collapse: 'timestamp:4',
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

      var dataMapped = data.map(function(row) {
        var url = row[2].replace(':80', '');
        return {
          url: `https://web.archive.org/web/${row[1]}/${url}`,
          timestamp: row[1],
          original_url: row[2],
          content_type: row[3],
          response_code: row[4],
          screenshot_url: getScreenshot(row)
        }
      });

      var dataProcessed = processData(dataMapped);

      this.setState({results: dataProcessed});
    });
  }

  render() {
    var submitText = this.state.isLoading ? 'Loading...' : 'Submit';

    return (
      <div className="App">
        <div className="App-header">
          <form onSubmit={this.handleSubmit}>
            <img className="wayback-logo" src="/images/Wayback_Machine_logo_2010.svg" />
            <input type="text" defaultValue={this.state.searchValue} onChange={this.handleSearchChange} ref="searchEl" />
            <input type="submit" value={submitText} disabled={this.state.isLoading}/>
          </form>
        </div>
        <CoverFlow data={this.state.results} />
        <a href="/about.html" className="about-link">About</a>

      </div>
    );
  }
}

export default App;
