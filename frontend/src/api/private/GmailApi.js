import { apiGet, apiPost } from "../common/_fetch";

export async function listupGmail(selectedScript, InputSearchMailNumber, sendEmailFlg) {
    const res = await apiGet(`gmail/listup/${selectedScript}?number_of_mails=${InputSearchMailNumber.current.value}&send_email_flg=${sendEmailFlg}`);
    return res;
}

export async function downloadCsv(selectedScript, setDownloadLink) {
    const res_download = await apiGet(`gmail/listup/${selectedScript}/csv/download`);
    setDownloadLink(res_download.url);
    return res_download;
}

// Fetch api to show graph
export async function showGraph(selectedScript) {
    const res_graph = await apiGet(`gmail/listup/${selectedScript}/graph/show`);
    console.log("Graph Response:", res_graph);
    return res_graph;
}