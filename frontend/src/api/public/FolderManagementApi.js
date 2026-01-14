import { apiGet, apiPost } from "../common/_fetch";

export async function GetRelativePath(basePath) {
    return await apiGet(`/management/folder/get/relativePath?basePath=${encodeURIComponent(basePath)}`);
}

export async function ChangeNameSeveral(requestData) {
    return await apiPost(`/management/file/changename/several`, requestData);
}

export async function CheckExistingJson(folderPath) {
    return await apiGet(`/management/folder/check/json?folderPath=${encodeURIComponent(folderPath)}`);
}

export async function ListJsonData(existingCheck) {
    return await apiGet(`/management/json/list/files?jsonPath=${encodeURIComponent(existingCheck.json_path)}`);
}

export async function ViewFiles(folderPath) {
    return await apiGet(`/management/folder/view/files?folderPath=${encodeURIComponent(folderPath)}`);
}