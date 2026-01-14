import { useState, useEffect, useRef } from "react";

// Task Scheduler Create Component. 
// create a new task scheduler by providing task name, date, time, timespan and file to execute.
function TaskCreateComponent() {

    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [timespan, setTimespan] = useState("");
    const [filePath, setFilePath] = useState("");
    const [command, setCommand] = useState("");

    const [data, setData] = useState({ status: "", message: "" });

    const handleSubmit = async () => {

        if (!name.trim()) {
            alert("Task name is required.");
            return;
        }
        if (!date) {
            alert("Task date is required.");
            return;
        }
        if (!time) {
            alert("Task time is required.");
            return;
        }
        if (!filePath && !command) {
            alert("Please provide either a file path or a command.");
            return;
        }

        let payload = {
            name: name,
            date: date,
            time: time,
            timespan: timespan,
            command: command,
            file_path: filePath
        };

        if (filePath) {
            payload.file_path = filePath;
        }
        if (command) {
            payload.command = command;
        }

        const res = await fetch("http://localhost:5000/task/create", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        setData(data);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFilePath(file.name);
        }
    };

    return (
        <div>
            <h2>Create Task</h2>
            <p>Selected File Path: {filePath}</p>

            <input
                type="text"
                placeholder="Task Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="date"
                placeholder="Task Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />
            <input
                type="time"
                placeholder="Task Time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
            />

            <input
                type="text"
                placeholder="Shutdown Timespan (e.g., 300 for 5 minutes)"
                value={timespan}
                onChange={(e) => setTimespan(e.target.value)}
            />

            <input
                type="text"
                placeholder="Command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
            />

            <p> Command: {command} </p>

            <h2> File Path </h2>
            <input type="file" accept=".py,.js,.exe,.bat" onChange={handleFileChange} />
            <p> Choose a file to upload</p>
            <p> File Types: .py, .js, .exe, .bat </p>
            <br />
            <p> Selected File Path: {filePath} </p> 
           
            <button onClick={handleSubmit}> Create</button>


            <p> Status: {data.status} </p>
            <p> Message: {data.message} </p>
        </div>
    );
}

export default TaskCreateComponent;

// Wrapper component from scheme/private/TaskCreate.js
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

export { TaskCreate };