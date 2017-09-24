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
      searchValue: 'https://jquery.org',
      results: [],
      isLoading: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  handleSubmit(event) {
    this.fetchData(this.state.searchValue);
    event.preventDefault();
  }

  handleSearchChange(event) {
    this.setState({searchValue: event.target.value});
    event.preventDefault();
  }

  fetchData(searchValue) {
    // Remove https:// and http://
    searchValue = searchValue.replace('https://' , '');
    searchValue = searchValue.replace('http://' , '');

    this.setState({isLoading: true});

    // metadata
    jQuery.getJSON({
      url: 'http://web.archive.org/cdx/search/cdx',
      data: {
        url: searchValue,
        output: 'json',
        matchType: 'prefix',
        limit: 10
      },
    }).then((data) => {
      this.setState({isLoading: false});

      console.log(data);

      // remove first element from array
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


      this.setState({
        results: data.map(function(row) {
          //  https://web.archive.org/web/20160904103421id_/http://web.archive.org/screenshot/http://iskme.org/
          var url = row[2].replace(':80', '');
          var screenshot_url = `https://web.archive.org/web/${row[1]}id_/http://web.archive.org/screenshot/${url}`;
          return {
            url: `https://web.archive.org/web/${row[1]}/${url}`,
            timestamp: row[1],
            original_url: row[2],
            content_type: row[3],
            response_code: row[4],
            screenshot_url: screenshot_url
          }
        })
      });

    });
    // // items
    // jQuery.getJSON(buildSearchUrl({
    //   q: 'collection:' + identifier + ' AND NOT mediatype:collection',
    //   rows: 10,
    // })).then((data) => {
    //   // console.log(data.response);
    //   this.setState({
    //     numFound: data.response.numFound,
    //     start: data.response.start,
    //     items: data.response.docs
    //   });
    // });
    // // collections
    // jQuery.getJSON(buildSearchUrl({
    //   q: 'collection:' + identifier + ' AND mediatype:collection',
    //   rows: 10
    // })).then((data) => {
    //   // console.log(data.response);
    //   this.setState({
    //     collections: data.response.docs
    //   });
    // });

  }



  render() {
    var loadingEl;
    if (this.state.isLoading) {
      loadingEl = <h1>Loading!!</h1>;
    }

    return (
      <div className="App">
        <div className="">
          <form onSubmit={this.handleSubmit}>
            <input value={this.state.searchValue} onChange={this.handleSearchChange} />
            <input type="submit" />
          </form>

          <loadingEl />
          <CoverFlow data={this.state.results} />

        </div>
      </div>
    );
  }
}

export default App;
