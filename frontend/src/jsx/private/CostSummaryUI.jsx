import { useState, useEffect, useRef } from "react";


// AWS Cost Summary Component
function AWSCostSummaryComponent() {

    const [Result, setResult] = useState();

    const GetAWSSummary = async () => {
        try {
            const res = await fetch(`http://localhost:5000/mail/summary/aws-gmail`, {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            });

            const data = await res.json();
            console.log("Response:", data);
            setResult(data);
            
        } catch (error) {
            console.error("Error:", error);
            setResult({error: error.message});
        }
    };

    return (
        <div>
            <h2> AWS Cost Summary </h2>
            <div>
                <button onClick={GetAWSSummary}>Submit</button>
                <p> Result: {JSON.stringify(Result)}</p>
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

    const GetCostSummary = async () => {

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/mail/summary/cost-gmail?number_of_mails=${InputSearchMailNumber.current.value}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"}
            });

            const data = await res.json();
            console.log("Response:", data);
            setResult(data);
            setDownloadLink("http://localhost:5000/mail/summary/cost-gmail/download");
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