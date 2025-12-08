import { useState, useEffect, useRef } from "react";


// AWS Cost Summary Component
function AWSCostSummaryComponent() {

    const [Result, setResult] = useState();
    const [Loading, setLoading] = useState(false);
    const [mailNumber, setMailNumber] = useState(50);

    const [message, setMessage] = useState("");
    const [NumberOfData, setNumberOfData] = useState(0);
    const [gsheetName, setGsheetName] = useState("");
    const [gsheetLink, setGsheetLink] = useState("");
    const [sendEmailFlg, setSendEmailFlg] = useState(false);
    
    const GetAWSSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000//mail/summary/aws_gmail/?mailNumber=${mailNumber}&send_email_flg=${sendEmailFlg}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            });

            const data = await res.json();
            console.log("Response:", data);
            setResult(data);
            setLoading(false);

            setMessage(data.message || "");
            setNumberOfData(data.number_of_data || 0);
            setGsheetName(data.gsheet_name || "");
            setGsheetLink(data.gsheet_link || "");

        } catch (error) {
            console.error("Error:", error);
            setResult({error: error.message});
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="mb-3"> AWS Cost Summary from Gmail </h2>

            <div className="mb-3">
                <h3>
                    <label className="form-label">Number of Mails to search</label>
                </h3>

                <input 
                    type="number" 
                    min="1" 
                    max="100000" 
                    step="1" 
                    value={mailNumber} 
                    onChange={(e) => setMailNumber(e.target.value)} 
                    className="form-control w-25"
                />
                    
                <div className="form-check mt-2">
                    <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="sendEmailFlg" 
                        checked={sendEmailFlg} 
                        onChange={(e) => setSendEmailFlg(e.target.checked)} 
                    />
                    <label className="form-check-label" htmlFor="sendEmailFlg">
                        Send Email
                    </label>
                </div>

                <button onClick={GetAWSSummary} className="btn btn-primary">
                    Submit
                </button>

                {Loading && <p className="text-muted"> Loading... </p>}
                {Result && (
                    <div className="mt-2">

                        <h5> Summary Result: </h5>
                        <pre className="bg-light p-2 border rounded"> 
                            Message: {message}

                            <br />
                            Number of Data: {NumberOfData}
                            
                            <br />
                            GSheet Name: {gsheetName}
                            {gsheetLink && (
                                <>
                                    <br />
                                    GSheet Link: <a href={gsheetLink} target="_blank" rel="noopener noreferrer">{gsheetLink}</a>
                                </>
                            )}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}


// Default export component
function CostSummaryComponent() {

    const [Result, setResult] = useState();
    const [DownloadLink, setDownloadLink] = useState(null);
    const [Loading, setLoading] = useState(false);
    const InputSearchMailNumber = useRef(null);
    const [sendEmailFlg, setSendEmailFlg] = useState(false);

    const GetCostSummary = async () => {

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/mail/summary/credit_cost?number_of_mails=${InputSearchMailNumber.current.value}&send_email_flg=${sendEmailFlg}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            });

            const data = await res.json();
            console.log("Response:", data);
            setResult(data);
            
            setDownloadLink("http://localhost:5000/mail/summary/credit_cost/download");
            setLoading(false);

        } catch (error) {
            console.error("Error:", error);
            setResult({error: error.message});
            setDownloadLink(null);
            setLoading(false);
        }
    };

    return (
        <div>
            <h2> Cost Summary </h2>
            <div>
                <h3> Number of Mails to search</h3>
                <input type="number" min="1" max="100000" step="1" ref={InputSearchMailNumber} />
                <br />

                <h3> Send Email</h3>
                <div className="form-check mt-2">
                    <input 
                        type="checkbox" 
                        className="form-check-input" 
                        id="sendEmailFlg" 
                        checked={sendEmailFlg} 
                        onChange={(e) => setSendEmailFlg(e.target.checked)} 
                    />
                    <label className="form-check-label" htmlFor="sendEmailFlg">
                        Send Email
                    </label>
                </div>

                <button onClick={GetCostSummary} className="btn btn-primary">Submit</button>

                <div className="mt-3">
                    {Loading ?
                        <p> Loading... </p>
                        : (
                            <></>
                        )
                    }
                    
                    <p> Result: {JSON.stringify({status: Result?.status, message: Result?.message})}</p>

                    {DownloadLink && (
                        <p>
                            <a href={DownloadLink} download className="btn btn-success">
                                Download Cost Summary CSV
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export {AWSCostSummaryComponent, CostSummaryComponent};