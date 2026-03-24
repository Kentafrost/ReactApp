import { useState, useEffect, useRef } from "react";
import { 
    createTask, 
    listTasks, 
    enableDisableTask 
} from '../../api/private/TaskApi';

// Task Scheduler Create Component. 
// create a new task scheduler by providing task name, date, time, timespan and file to execute.
function TaskCreateComponent({ onTaskCreated }) {

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

        const res = await createTask(payload);
        setData(res);
        
        // after creating a task, update the list
        if (res.status === "success" && onTaskCreated) {
            onTaskCreated();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFilePath(file.name);
        }
    };

    return (
        <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
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

// fetch the task list from the backend and display them.(Already working)
function TaskListupComponent({ onSelect, schedules }) {
    return (
        <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
            <h2> Task Scheduler List </h2>
            {schedules.length > 0 ? (
                schedules.map((item, index) => (
                    <div key={index} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px', borderRadius: '3px' }}>
                        <p> Task Name: {item.name} </p>
                        <p> Task Status: {item.enabled ? "Enabled" : "Disabled"} </p>
                        <button onClick={() => onSelect(item)}>Select</button>
                    </div>
                ))
            ) : (
                <p>No tasks found.</p>
            )}
        </div>
    );
}

// Enable / Disable Task Component. 
function TaskOnOff({ selectedTask, onTaskUpdated }) {

    const [check, setCheck] = useState("enable");
    const [statusMessage, setStatusMessage] = useState("");
    const [TaskName, setTaskName] = useState("");

    const handleEnableDisable = async () => {
        if (!selectedTask) { return; }

        try {
            const res = await enableDisableTask(selectedTask.name, check);
            console.log("Response:", res);
            setStatusMessage(res.message || "Operation completed.");
            setTaskName(res.task_name || "");
            
            // after enabling/disabling a task, update the list
            if (onTaskUpdated) {
                onTaskUpdated();
            }

        } catch (error) {
            console.error("Error:", error);
            setStatusMessage("An error occurred. Please try again.");
            setTaskName("");
        }
    };

    return (
        <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
            <h2> Enable / Disable Task Scheduler </h2>
            {selectedTask ? (
                <div>
                    <p> Selected Task: {selectedTask.name} </p>
                    <button 
                        onClick={() => setCheck("enable")}
                        style={{ backgroundColor: check === "enable" ? "#4CAF50" : "#f1f1f1", margin: "5px" }}
                    >
                        Enable
                    </button>
                    <button 
                        onClick={() => setCheck("disable")}
                        style={{ backgroundColor: check === "disable" ? "#f44336" : "#f1f1f1", margin: "5px" }}
                    >
                        Disable
                    </button>
                    
                    <br />
                    <button onClick={handleEnableDisable} style={{ marginTop: '10px' }}>Submit</button>

                    <p>{statusMessage}</p>
                    <p> Task Name: {TaskName} </p>

                </div>
            ) : (
                <p> No task selected. Please select a task from the list. </p>
            )}
        </div>
    );
}

// Main Task Scheduler App Component - integrates all features: create, list, enable/disable
function TaskSchedulerApp() {
    const [selectedTask, setSelectedTask] = useState(null);
    const [schedules, setSchedules] = useState([]);

    const fetchSchedules = async () => {
        try {
            const res = await listTasks();
            setSchedules(res.tasks || []);
        } catch (err) {
            console.error("Error fetching schedules:", err);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleTaskCreated = () => {
        // after creating a task, update the list
        fetchSchedules();
    };

    const handleTaskUpdated = () => {
        // after updating a task, update the list
        fetchSchedules();
    };

    return (
        <div>
            <TaskCreateComponent onTaskCreated={handleTaskCreated} />
            <TaskListupComponent onSelect={setSelectedTask} schedules={schedules} />
            <TaskOnOff selectedTask={selectedTask} onTaskUpdated={handleTaskUpdated} />
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
          Edit <code>src/components/private/TaskCreateUI.jsx</code> and save to reload.
        </p>
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>

      <div>
        <h1> Task Scheduler Management </h1>
        <p>Create new tasks, manage existing tasks, and enable/disable task scheduling</p>
        <TaskSchedulerApp />
      </div>
    </div>
  );
}

// TaskSwitch feature also integrated component
function TaskSwitch() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header>
        <p>
          Edit <code>src/components/private/TaskCreateUI.jsx</code> and save to reload.
        </p>
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>

      <div>
        <h1> Task Scheduler Management </h1>
        <p>Create new tasks, manage existing tasks, and enable/disable task scheduling</p>
        <TaskSchedulerApp />
      </div>

    </div>
  );
}

export { TaskCreate, TaskSwitch, TaskSchedulerApp };