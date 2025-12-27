import { useState, useRef } from "react";

// Default export component
function GmailSummaryComponent() {

    const [Result, setResult] = useState();
    const [Loading, setLoading] = useState(false);
    const [sendEmailFlg, setSendEmailFlg] = useState(false);

    const InputSearchMailNumber = useRef(null);
    const [DownloadLink, setDownloadLink] = useState(null);
    const [GraphLink, setGraphLink] = useState(null);

    const [gsheet, setGsheet] = useState(null);

    const scripts = [
        {label: "Credit Online Course", value: "credit_online_course"}, 
        {label: "AWS gmail Listup", value: "aws_related_gmail"}
    ];

    const [selectedScript, setSelectedScript] = useState(scripts[0].value);
    const runScript = (scriptName) => {
        setSelectedScript(scriptName);
    };

    if (!selectedScript) {
        return <div> No script selected </div>;
    }

    const GetCostSummary = async () => {

        setLoading(true);
        setGsheet(null);

        if (!InputSearchMailNumber.current || !InputSearchMailNumber.current.value) {
            alert("Please enter the number of mails to search.");
            setLoading(false);
            return;
        }

        try {
            // Fetch api to get gmail summary
            const res = await fetch(`http://localhost:5000/mail/listup/${selectedScript}?number_of_mails=${InputSearchMailNumber.current.value}&send_email_flg=${sendEmailFlg}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            });

            const data = await res.json();
            console.log("Response:", data);
            setResult(data);

            if (selectedScript !== "credit_online_course") {
                setDownloadLink(null);
                setGraphLink(null);
                setGsheet(data.gsheet_link || null);
                setLoading(false);
                return;
            }

            // Fetch api to download csv
            const res_download = await fetch(`http://localhost:5000/mail/listup/${selectedScript}/csv/download`);
            console.log("Download Response:", res_download);
            setDownloadLink(res_download.url);

            // Fetch api to show graph
            const res_graph = await fetch(`http://localhost:5000/mail/listup/${selectedScript}/graph/show`);
            console.log("Graph Response:", res_graph);
            setGraphLink(res_graph.url);
            setLoading(false);

        } catch (error) {
            console.error("Error API", error);
            setResult({error: error.message});

            setDownloadLink(null);
            setGraphLink(null);
            setLoading(false);
            return;
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div>
                <h3> Number of Mails to search</h3>
                <br/>

                <input 
                    type="number" min="1" max="100000" step="1" defaultValue="50"
                    ref={InputSearchMailNumber} />
                <br />

                <br />

                <h3>Send Email</h3>
                
                <div className="d-flex justify-content-center align-items-center">
                    <label htmlFor="sendEmailFlg" className="me-2"> Send Email with Summary </label>

                    <input
                        type="checkbox" 
                        id="sendEmailFlg" 
                        checked={sendEmailFlg}
                        className="form-check-input" 
                        onChange={(e) => setSendEmailFlg(e.target.checked)} 
                    />
                </div>

                <br />
                <p />
                <div>
                    <h3> Select Script</h3>

                    <select onChange={(e) => runScript(e.target.value)}>
                    {scripts.map(s => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                    </select>
                </div>

                <br />
                <button onClick={GetCostSummary} className="btn btn-primary">Submit</button>

                <div className="mt-3">
                    {Loading ?
                        <p> Loading... </p>
                        : (
                            <></>
                        )
                    }
                    
                    <p> Result: {JSON.stringify({status: Result?.status, message: Result?.message})}</p>

                    {gsheet && (
                        <p>
                            GSheet Link: <a href={gsheet} target="_blank" rel="noopener noreferrer">{gsheet}</a>
                        </p>
                    )}

                    {DownloadLink && (
                        <p>
                            <a href={DownloadLink} download className="btn btn-success">
                                Download Cost Summary CSV
                            </a>
                        </p>
                    )}

                    {GraphLink && (
                        <p>
                            <a href={GraphLink} target="_blank" rel="noopener noreferrer" className="btn btn-info">
                                Show Cost Summary Graph
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export {GmailSummaryComponent};