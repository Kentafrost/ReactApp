import { useState, useEffect, useRef } from "react";


// AWS Cost Summary Component
function AWSCostSummaryComponent() {

    const [Result, setResult] = useState();

    const GetAWSSummary = async () => {

        try {
            const res = await fetch(`http://localhost:5000/mail/summary/aws-gmail`, {
                method: "GET",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({}),
            });

            const data = await res.json();
            console.log("Response:", data);
            setResult(data);
            
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <h2> AWS Cost Summary </h2>
            <div>
                <button onClick={GetAWSSummary}>Submit</button>
                <p> Result {JSON.stringify(Result)}</p>

            </div>
        </div>
    );
}


// Default export component
function CostSummaryComponent() {

    const [Result, setResult] = useState();

    const GetCostSummary = async () => {

        try {
            const res = await fetch(`http://localhost:5000/mail/summary/cost-gmail`, {
                method: "GET",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({}),
            });

            const data = await res.json();
            console.log("Response:", data);
            setResult(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <h2> Cost Summary </h2>
            <div>
                <button onClick={GetCostSummary}>Submit</button>
                <p> Result {JSON.stringify(Result)}</p>
            </div>
        </div>
    );
}


export { AWSCostSummaryComponent, CostSummaryComponent };