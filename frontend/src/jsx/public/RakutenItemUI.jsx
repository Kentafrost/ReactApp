import { useState, useEffect, useRef } from "react";


// fetch the task list from the backend and display them.(Already working)
function RakutenItemUIComponent ( { onSelect } ) {

    // for listing all items on rakuten
    const [number_hits, setNumberHits] = useState(0);
    const [page, setPage] = useState(0);
    const [max_page, setMaxPage] = useState(0);
    const [keywords, setKeywords] = useState("");
    
    const [items, setfullItems] = useState([]);

    // for filtering uses
    const [min_money, setMinMoney] = useState(0);
    const [max_money, setMaxMoney] = useState(0);
    const [makers, setMakers] = useState("");
    const [shop_code, setShopCode] = useState("");

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(
                    `http://localhost:5000//rakuten/items/listup?number_hits=${number_hits}&page=${page}&max_page=${max_page}&keywords=${keywords}`
                );
                const json = await res.json();
                console.log("Fetched items:", json);
                setfullItems(Object.values(json.results).flatMap(r => r.data));
            } catch (err) {
                console.error("Error fetching items:", err);
            }
        };
        fetchItems();
    }, [number_hits, page, max_page, keywords]);


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

            <h2> Filter Options </h2>
            <div>
                <div>

                    <label> Min Money: </label>
                    <input type="number" value={min_money} onChange={(e) => setMinMoney(e.target.value)} />
                </div>

                <div>
                    <label> Max Money: </label>
                    <input type="number" value={max_money} onChange={(e) => setMaxMoney(e.target.value)} />
                </div>

                <div>
                    <label> Makers (comma separated): </label>
                    <input type="text" value={makers} onChange={(e) => setMakers(e.target.value)} />
                </div>
                <div>
                    <label> Shop Code: </label>
                    <input type="text" value={shop_code} onChange={(e) => setShopCode(e.target.value)} />
                </div>
            </div>
        </div>
    );
}


export default RakutenItemUIComponent;