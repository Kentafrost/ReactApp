import React from 'react';
import { RakutenItemUIComponent } from '../../jsx/public/RakutenItemUI';

function RakutenItemUI() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header>
        <p>
          Edit <code>src/js/CostSummary.js</code> and save to reload.
        </p>
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>

      <div>
        <h1> Rakuten Item List </h1>

        <RakutenItemUIComponent />
      </div>

    </div>
  );
}

export default RakutenItemUI;