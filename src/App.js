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
  var url2 = row.original_url.replace(':80', '');
  var fullurl = encodeURIComponent(`http://web.archive.org/web/${row.timestamp}if_/${url2}`);
  return `${baseUrl}?url=${fullurl}`
}

function getScreenshotChromium(row) {
  // http://richard-dev.us.archive.org:8200/?url=www.google.com
  var baseUrl = 'http://richard-dev.us.archive.org:8012/chromium_screenshot.php';
  var url2 = row.original_url.replace(':80', '');
  var fullurl = encodeURIComponent(`http://web.archive.org/web/${row.timestamp}if_/${url2}`);
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
  var url2 = encodeURIComponent(row.original_url.replace(':80', ''));
  return `${baseUrl}?timestamp=${row.timestamp}&url=${url2}` /* &format=jpeg`*/
}

function getScreenshotIACors(row) {
  var url = encodeURIComponent(getScreenshotIA(row));
  return `//archive.org/~richard/dev/cors.php?url=${url}`
}

var getScreenshot = getScreenshotChromium;

// Processes data returned from the server
// eg filter out known defects (like craigslist)
function processData(data) {
  return data.reduce(function(accumulator, row) {
    console.log(row);

    // Craiglist data that's not actually craigslist
    if (row.url == 'https://web.archive.org/web/20130706025735/http://www.craigslist.org/') {
      return accumulator;
    }

    if (row.timestamp == '20010331202829' && row.original_url == 'http://www15.cnn.com:80/') {
      row.timestamp = '20011217230047';
      row.original_url = 'http://www.cnn.com:80/';
      row.screenshot_url = getScreenshot(row);
    }

    if (row.original_url == 'http://www.cnn.com/' && row.timestamp == '20170101011458') {
      return accumulator;
    }

    if (row.original_url == 'http://msn.com:80/' && (row.timestamp == '19980117075209' || row.timestamp == '19970219051533')) {
      return accumulator;
    }

    if ((
      row.original_url == 'http://www.facebook.com:80/'
      || row.original_url == 'http://www.facebook.com/'
    )
    && (
      row.timestamp == "20020328015153"
      || row.timestamp == "20030217025734"
      || row.timestamp == "20110101081238"
    )) {
      return accumulator;
    }

    if (row.original_url == "http://www.bpl.org:80/" && row.timestamp == '20160104234746') {
      return accumulator;
    }

    if ((row.original_url == "http://www1.geocities.com:80" && row.timestamp == "20010304052057")
      || (row.original_url == "http://www.geocities.com/" && row.timestamp == "20170715195443")
    ) {
      return accumulator;
    }

    if ((row.original_url == "http://www.wsj.com:80/" && row.timestamp == "19980209124854")
      || (row.original_url == "http://wsj.com/" && row.timestamp == "20130611211058")
    ) {
      return accumulator;
    }

    if ((row.original_url == "http://www.iskme.org/" && row.timestamp == "20100107105840")
      || (row.original_url == "http://iskme.org/" && row.timestamp == "20090107015605")
      || (row.original_url == "http://www.iskme.org:80/" && row.timestamp == "20080211222124")
    ) {
      return accumulator;
    }


    //---------- END HACKS --------

    // Set more props
    row.screenshot_url = getScreenshot(row);
    row.url = `https://web.archive.org/web/${row.timestamp}/${row.original_url}`,

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
      autoplay: getParameterByName('autoplay') !== null ? true : false
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
      //url: 'http://web.archive.org/cdx/search/cdx',
      url: 'https://archive.org/~richard/dev/cdx_sample.php', // caching
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
          timestamp: row[1],
          original_url: row[2],
          content_type: row[3],
          response_code: row[4],
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
        <CoverFlow data={this.state.results} autoplay={this.state.autoplay} />
        <a href="/about.html" className="about-link">About</a>

      </div>
    );
  }
}

export default App;
