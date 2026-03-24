import { useState, useRef } from "react";
import { 
    listupGmail, 
    downloadCsv, 
    showGraph 
} from '../../api/private/GmailApi';

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
            const data = await listupGmail(selectedScript, InputSearchMailNumber, sendEmailFlg);
            console.log("Response:", data);
            setResult(data);

            if (selectedScript !== "credit_online_course") {
                setDownloadLink(null);
                setGraphLink(null);
                setGsheet(data.gsheet_link || null);
                setLoading(false);
                return;
            }

            // Fetch api to download a csv to know how many mails have been searched
            const res_download = await downloadCsv(selectedScript, setDownloadLink);
            console.log("Download Response:", res_download);

            // Fetch api to show a gmail data graph
            const res_graph = await showGraph(selectedScript);
            console.log("Graph Response:", res_graph);

            const graphBlob = await res_graph.blob();
            const graphUrl = URL.createObjectURL(graphBlob);
            
            setGraphLink(graphUrl);
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
            <div className="d-flex justify-content-center">
                <table className="table table-bordered" style={{maxWidth: '500px'}}>
                    <tbody>
                        <tr>
                            <td className="text-start align-middle">
                                <strong>Number of Mails to Search:</strong>
                            </td>
                            <td>
                                <input 
                                    type="number" min="1" max="100000" step="1" defaultValue="50"
                                    ref={InputSearchMailNumber}
                                    className="form-control"
                                    style={{maxWidth: '200px'}}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="text-start align-middle">
                                <strong>Send Email with Summary:</strong>
                            </td>
                            <td className="text-start">
                                <input
                                    type="checkbox" 
                                    id="sendEmailFlg" 
                                    checked={sendEmailFlg}
                                    className="form-check-input"
                                    onChange={(e) => setSendEmailFlg(e.target.checked)} 
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="text-start align-middle">
                                <strong>Select Script:</strong>
                            </td>
                            <td>
                                <select onChange={(e) => runScript(e.target.value)} className="form-select" style={{maxWidth: '300px'}}>
                                    {scripts.map(s => (
                                        <option key={s.value} value={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
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

                {Result && (
                    <div className="mt-5">
                        <div className="text-center mb-4">
                            <h2 className="text-primary"> 
                                <strong>EXECUTION RESULTS</strong>
                            </h2>
                        </div>
                        
                        <div className="d-flex justify-content-center">
                            <table className="table table-bordered table-hover" style={{maxWidth: '600px', backgroundColor: '#f8f9fa'}}>
                                <thead className="table-dark">
                                    <tr>
                                        <th scope="col" className="text-center">Item</th>
                                        <th scope="col" className="text-center">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="text-start align-middle"><strong>Number of Saved Data:</strong></td>
                                        <td className="text-start align-middle">
                                            <span className="badge bg-success fs-6">{JSON.stringify(Result.number_of_data, null, 2)}</span>
                                        </td>
                                    </tr>
                                    {gsheet && (
                                        <tr>
                                            <td className="text-start align-middle"><strong>Google Sheet:</strong></td>
                                            <td className="text-start align-middle">
                                                <a href={gsheet} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                                    View Sheet
                                                </a>
                                            </td>
                                        </tr>
                                    )}
                                    {DownloadLink && (
                                        <tr>
                                            <td className="text-start align-middle"><strong>CSV Download:</strong></td>
                                            <td className="text-start align-middle">
                                                <a href={DownloadLink} download className="btn btn-success btn-sm">
                                                    Download CSV
                                                </a>
                                            </td>
                                        </tr>
                                    )}

                                    <tr>
                                        <td className="text-start align-middle"><strong>Email Sent:</strong></td>
                                        <td className="text-start align-middle">
                                            {sendEmailFlg ?
                                                <span className="badge bg-first fs-6">Yes</span>
                                                :
                                                <span className="badge bg-secondary fs-6">No</span>
                                            }
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        {GraphLink && (
                            <div className="text-center mt-4">
                                <h3 className="mb-3">Cost Summary Graph</h3>

                                <img
                                    src={GraphLink}
                                    alt="Cost Summary Graph"
                                    className="img-fluid border rounded shadow"
                                    style={{ maxWidth: '800px', marginBottom: '20px' }}
                                    onLoad={() => console.log('Graph image loaded successfully')}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export {GmailSummaryComponent};

// Wrapper component from scheme/private/GmailSummary.js
function GmailSummary() {
  return (
    <div style={{ textAlign: 'center' }}>
      <header>
      </header>

      <div>
        <GmailSummaryComponent />
      </div>

    </div>
  );
}

export { GmailSummary };