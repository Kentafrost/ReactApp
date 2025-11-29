import React from 'react';
import {TaskSchedulerCreate } from '../jsx/TaskCreateUI';

function TaskSchedulerUI() {
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
        <h1> Task Scheduler Create New Task </h1>
        <TaskSchedulerCreate />
      </div>
    </div>
  );
}

export default TaskSchedulerUI;
