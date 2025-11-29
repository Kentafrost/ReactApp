import { useState, useEffect, useRef } from "react";


// fetch the task list from the backend and display them.(Already working)
function TaskScheduleListup ( { onSelect } ) {
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const res = await fetch("http://localhost:5000/task-scheduler/list", {
                    method: "GET",
                });
                const data = await res.json();
                setSchedules(data);
            } catch (err) {
                console.error("Error fetching schedules:", err);
            }
        };
        fetchSchedules();
        }, []);


        return (
            <div>
                <h2> Task Scheduler List </h2>
                {schedules.map((item, index) => (
                    <div key={index}>
                        <p> Task Name: {item.name} </p>
                        <p> Task Status: {item.enabled ? "Enabled" : "Disabled"} </p>
                        <button onClick={() => onSelect(item)}>Select</button>
                    </div>
                ))}
            </div>
        );
    }


// Enable / Disable Task Component. 
function TaskSchedulerOnOff( { selectedTask } ) {

    const [check, setCheck] = useState("enable");

    const [statusMessage, setStatusMessage] = useState("");
    const [TaskName, setTaskName] = useState("");

    const handleEnableDisable = async () => {
        if (!selectedTask) { return; }

        try {
            const res = await fetch(`http://localhost:5000/task-scheduler/enable`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ 
                    task_name: selectedTask.name, 
                    check: check
                }),
            });

            const data = await res.json();
            console.log("Response:", data);
            setStatusMessage(data.message || "Operation completed.");
            setTaskName(data.task_name || "");

        } catch (error) {
            console.error("Error:", error);
            setStatusMessage("An error occurred. Please try again.");
            setTaskName("");
        }
    };

    return (
        <div>
            <h2> Enable / Disable Task Scheduler </h2>
            {selectedTask ? (
                <div>
                    <p> Selected Task: {selectedTask.name} </p>
                    <button onClick={() => setCheck("enable")}>Enable</button>
                    <button onClick={() => setCheck("disable")}>Disable</button>
                    
                    <button onClick={handleEnableDisable}>Submit</button>

                    <p>{statusMessage}</p>
                    <p> Task Name: {TaskName} </p>

                </div>
            ) : (
                <p> No task selected. Please select a task from the list. </p>
            )}
        </div>
    );
}

// Main Task Scheduler App Component
function TaskSchedulerApp() {
    const [selectedTask, setSelectedTask] = useState(null);

    return (
        <div>
            <TaskScheduleListup onSelect={setSelectedTask} />
            <TaskSchedulerOnOff selectedTask={selectedTask} />
        </div>
    );
}

export { TaskSchedulerApp };