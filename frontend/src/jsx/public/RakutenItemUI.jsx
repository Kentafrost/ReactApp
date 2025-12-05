import { useState, useEffect, useRef } from "react";


// fetch the task list from the backend and display them.(Already working)
function RakutenItemUIComponent ( { onSelect } ) {
    const [number_hits, setNumberHits] = useState(0);
    const [page, setPage] = useState(0);
    const [max_page, setMaxPage] = useState(0);
    const [keywords, setKeywords] = useState("");
    const [requirements, setRequirements] = useState("");
    
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(
                    `http://localhost:5000//rakuten/items/listup?number_hits=${number_hits}&page=${page}&max_page=${max_page}&keywords=${keywords}&requirements=${requirements}`
                );
                const json = await res.json();
                setItems(Object.values(json.results).flatMap(r => r.data));
            } catch (err) {
                console.error("Error fetching items:", err);
            }
        };
        fetchItems();
    }, [number_hits, page, max_page, keywords, requirements]);


    return (
        <div>
            <div>
                <h2> Search Conditions </h2>
                <div>
                    <label> Number of Hits: </label>
                    <input type="number" value={number_hits} onChange={(e) => setNumberHits(e.target.value)} />
                </div>
                <div>
                    <label> Page: </label>
                    <input type="number" value={page} onChange={(e) => setPage(e.target.value)} />
                </div>
                <div>
                    <label> Max Page: </label>
                    <input type="number" value={max_page} onChange={(e) => setMaxPage(e.target.value)} />
                </div>
                <div>
                    <label> Keywords: </label>
                    <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                </div>
                <div>
                    <label> Requirements: </label>
                    <input type="text" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
                </div>
            </div>

            <h2> Rakuten Item List </h2>
            <div>
                {items.map((item, index) => (
                    <div key={index}>
                        <p> Item Name: {item.itemName} </p>
                        <p> Item Price: {item.itemPrice} </p>
                        <p> Item URL: <a href={item.itemUrl} target="_blank" rel="noopener noreferrer">{item.itemUrl}</a> </p>
                    </div>
                ))}
            </div>
        </div>
    );
}



export { RakutenItemUIComponent };