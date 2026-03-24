import { apiGet, apiPost } from "../common/_fetch";

export async function createTask(taskData) {
    const res = await apiPost("http://localhost:5000/task/create", taskData);
    return res;
}

export async function listTasks() {
    const res = await apiGet("http://localhost:5000/task/list");
    return res;
}

export async function enableDisableTask(task_name, check) {
    const res = await apiPost("http://localhost:5000/task/enable", { task_name, check });
    return res;
}