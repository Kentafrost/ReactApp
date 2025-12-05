import React from 'react';
import { AWSCostSummaryComponent, CostSummaryComponent } from '../../jsx/private/CostSummary';

function CostSummary() {
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
        <h1> AWS Cost Summary </h1>
        <AWSCostSummaryComponent />
      </div>

      <div>
        <h1> Cost Summary </h1>
        <CostSummaryComponent />
      </div>

    </div>
  );
}

export default CostSummary;