import React from 'react';
import {TaskCreateComponent } from '../../jsx/private/TaskCreateUI';

function TaskCreate() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header>
        <p>
          Edit <code>src/js/TaskCreate.js</code> and save to reload.
        </p>
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>

      <div>
        <h1> Task Scheduler Create New Task </h1>
        <TaskCreateComponent />
      </div>
    </div>
  );
}

export default TaskCreate;