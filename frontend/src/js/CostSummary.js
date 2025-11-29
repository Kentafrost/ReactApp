import React from 'react';
import { AWSCostSummary } from '../jsx/CostSummary';

function AWSCostSummaryUI() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header>
        <p>
          Edit <code>src/js/TaskScheduler.js</code> and save to reload.
        </p>
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>

      <div>
        <h1> AWS Cost Summary </h1>
        <AWSCostSummary />
      </div>

    </div>
  );
}

export default AWSCostSummaryUI;
