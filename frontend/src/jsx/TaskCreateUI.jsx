import { useState, useEffect, useRef } from "react";

// Task Scheduler Create Component. 
// create a new task scheduler by providing task name, date, time, timespan and file to execute.
function TaskSchedulerCreate() {

    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [timespan, setTimespan] = useState("");
    const [fileName, setFileName] = useState("");

    const fileInputRef = useRef(null);

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("date", date);
        formData.append("time", time);
        formData.append("timespan", timespan);

        if (fileInputRef.current.files[0]) {
            formData.append("file", fileInputRef.current.files[0]);
        }

        const res = await fetch("http://localhost:5000/task-scheduler/create", {
            method: "POST",
            body: JSON.stringify({
                name: name,
                date: date,
                time: time,
                file_path: fileName
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        alert(data.message);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
        }
    };

    return (
        <div>
            <h2>Create Task</h2>
            <p>Selected File: {fileName}</p>

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

            <h2> File Path </h2>
            <input type="file" accept=".py,.js,.exe,.bat" onChange={handleFileChange} />
            <p> Choose a file to upload</p>
            <p> File Types: .py, .js, .exe, .bat </p>
            <br />
            <p> Selected File: {fileName} </p> 

            <button onClick={handleSubmit}> Create</button>
        </div>
    );
}


export { TaskSchedulerCreate };