import { useState, useEffect } from "react";


// fetch the task list from the backend and display them.(Already working)
function RakutenItemUIComponent ( { onSelect } ) {

    // for listing all items on rakuten
    const [number_hits, setNumberHits] = useState(10);
    const [page, setPage] = useState(1);
    const [max_page, setMaxPage] = useState(3);
    const [keywords, setKeywords] = useState("Desktop");


    // graph filter fields
    const [shop_name, setShopName] = useState("");

    // flag to check if items have been listed
    const [start, setStart] = useState(false);
    const [hasListed, setHasListed] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // full items from rakuten
    const [items, setfullItems] = useState([]);

    const [graphImagePath, setGraphImagePath] = useState("");
    const [filterStart, setFilterStart] = useState(false);

    // filter options state
    const [min_money, setMinMoney] = useState(0);
    const [max_money, setMaxMoney] = useState(0);
    const [makers, setMakers] = useState("");

    const [shops, setShops] = useState({});

    useEffect(() => {
        const fetchItems = async () => {
            if (!keywords) {
                setErrorMsg("Please enter keywords to search.");
                setHasListed(false);
                return;
            }
            if (number_hits <= 0 || page < 0 || max_page < 0) {
                setErrorMsg("Please enter valid search parameters.");
                setHasListed(false);
                return;
            }
            if (start) {
                try {
                    const res = await fetch(
                        `http://localhost:5000/rakuten/listup?number_hits=${number_hits}&page=${page}&max_page=${max_page}&keywords=${keywords}`
                    );
                    
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    
                    const json = await res.json();
                    console.log("API Response:", json); // デバッグログ
                    
                    // データの妥当性をチェック
                    if (json && json.results && Array.isArray(json.results)) {
                        setfullItems(json.results);
                        setHasListed(true);
                        setErrorMsg(""); // Clear any previous errors

                        // create graph with the fetched items for all items searched with the keywords
                        if (json.results.length > 0) {
                            console.log("Creating graph with data:", json.results);
                            
                            const graphRes = await fetch(
                            "http://localhost:5000/rakuten/graph/create", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ 
                                    json_data: JSON.stringify(json.results), 
                                    shop_name: null  // No shop filter for overall graph
                                }),
                            }
                            ); 

                            // collect all shops names for filter options
                            const optionsRes = await fetch(
                                "http://localhost:5000/rakuten/graph/filter/options", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        json_data: JSON.stringify(json.results)
                                    })
                                }
                            )

                            if (!optionsRes.ok) {
                                throw new Error(`HTTP error! status: ${optionsRes.status}`);
                            }
                            const optionsJson = await optionsRes.json();
                            console.log("Filter Options Response:", optionsJson); // デバッグログ
                            setShops(optionsJson);
                            
                            if (graphRes.ok) {
                                const graphBlob = await graphRes.blob();
                                const graphUrl = URL.createObjectURL(graphBlob);
                                setGraphImagePath(graphUrl);
                                setErrorMsg(""); // Clear any previous errors
                            } else {
                                console.error("Error fetching graph: HTTP", graphRes.status);
                                const errorText = await graphRes.text();
                                console.error("Error details:", errorText);
                                setGraphImagePath("");
                                setErrorMsg(`Error generating graph: ${graphRes.status} - ${errorText}`);
                            }
                        } else {
                            setGraphImagePath("");
                            setErrorMsg("No items found for the search keywords.");
                        }
                    } else {
                        console.error("Invalid API response structure:", json);
                        setErrorMsg("Invalid response format from API.");
                        setHasListed(false);
                    }
                } catch (err) {
                    console.error("Error fetching items:", err);
                    setErrorMsg(`Failed to fetch items: ${err.message}`);
                    setHasListed(false);
                }
            }
            };
            if (keywords) {
                fetchItems();
            }
        }, [number_hits, page, max_page, keywords, start]);


    // filtering with shop name
    useEffect(() => {
        if (filterStart) {
            if (!shop_name) {
                setErrorMsg("Please enter a shop name for filtering.");
                setFilterStart(false);
                return;
            }
            
            const fetchItems_graph_filter = async () => {

                // データの妥当性をチェック
                if (!Array.isArray(items) || items.length === 0) {
                    console.error("No valid items data for filtering:", items);
                    setErrorMsg("No items available for filtering.");
                    setFilterStart(false);
                    return;
                }

                try {
                    console.log("Filtering with shop_name:", shop_name, "Items:", items);
                    
                    const res_graph = await fetch(
                        `http://localhost:5000/rakuten/graph/create`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                json_data: JSON.stringify(items),
                                shop_name: shop_name
                            }),
                        }
                    )
                    
                    if (!res_graph.ok) {
                        throw new Error(`HTTP error! status: ${res_graph.status}`);
                    }
                    
                    const graphBlob = await res_graph.blob();
                    const graphUrl = URL.createObjectURL(graphBlob);
                    console.log("Filtered graph URL:", graphUrl);

                    setGraphImagePath(graphUrl);
                    setFilterStart(false);
                    setErrorMsg(""); // Clear any previous errors

                } catch (err) {
                    console.error("Error fetching filtered graph:", err);
                    const graphUrl_filter = "";
                    setGraphImagePath(graphUrl_filter);
                    setFilterStart(false);
                    setErrorMsg(`Error generating filtered graph: ${err.message}`);
                }
            };

            if (shop_name && items.length > 0) {
                fetchItems_graph_filter();
            }
        }
    }, [filterStart, shop_name, items]);

    // # Sample data fields from Rakuten API
    // # affiliateRate       = data["affiliateRate"]
    // # affiliateUrl        = data["affiliateUrl"]
    // # asurakuArea         = data["asurakuArea"]
    // # asurakuClosingTime  = data["asurakuClosingTime"]
    // # asurakuFlag         = data["asurakuFlag"]
    // # availability        = data["availability"]
    // # catchcopy           = data["catchcopy"]
    // # creditCardFlag      = data["creditCardFlag"]
    // # endTime             = data["endTime"]
    // # genreId             = data["genreId"]
    // # giftFlag            = data["giftFlag"]
    // # imageFlag           = data["imageFlag"]
    // # itemCaption         = data["itemCaption"]
    // # itemCode            = data["itemCode"]
    // # itemName            = data["itemName"]
    // # itemPrice           = data["itemPrice"]
    // # itemPriceBaseField  = data["itemPriceBaseField"]
    // # itemPriceMax1       = data["itemPriceMax1"]
    // # itemPriceMax2       = data["itemPriceMax2"]
    // # itemPriceMax3       = data["itemPriceMax3"]
    // # itemPriceMin1       = data["itemPriceMin1"]
    // # itemPriceMin2       = data["itemPriceMin2"]
    // # itemPriceMin3       = data["itemPriceMin3"]
    // # itemUrl             = data["itemUrl"]
    // # mediumImageUrls     = data["mediumImageUrls"]
    // # pointRate           = data["pointRate"]
    // # pointRateEndTime    = data["pointRateEndTime"]
    // # pointRateStartTime  = data["pointRateStartTime"]
    // # postageFlag         = data["postageFlag"]
    // # reviewAverage       = data["reviewAverage"]
    // # reviewCount         = data["reviewCount"]
    // # shipOverseasArea    = data["shipOverseasArea"]
    // # shipOverseasFlag    = data["shipOverseasFlag"]
    // # shopAffiliateUrl    = data["shopAffiliateUrl"]
    // # shopCode            = data["shopCode"]
    // # shopName            = data["shopName"]
    // # shopOfTheYearFlag   = data["shopOfTheYearFlag"]
    // # shopUrl             = data["shopUrl"]
    // # smallImageUrls      = data["smallImageUrls"]
    // # startTime           = data["startTime"]
    // # tagIds              = data["tagIds"]
    // # taxFlag             = data["taxFlag"]


    return (
    <div>
        <div style={{ padding: "20px" }}>
        <br />
        <h2> Search Conditions </h2>
        <br />

        <div style={{ marginTop: "30px" }}>
            <div>
                <label> Number of Hits(20まで選択可能): </label>
                <input type="number" max={20} value={number_hits} onChange={(e) => setNumberHits(e.target.value)} />
            </div>
            <div style={{ marginBottom: "10px" }}>
                <label style={{ marginRight: "10px" }}> 
                    Page(100まで選択可能): 
                </label>
                
                <input type="number" max={100} value={page} onChange={(e) => setPage(e.target.value)} />
            </div>

            <div style={{ marginBottom: "10px" }}>
                <label style={{ marginRight: "10px" }}> 
                    Max Page(3まで選択可能): 
                </label>
                
                <input type="number" max={3} value={max_page} onChange={(e) => setMaxPage(e.target.value)} />
            </div>

            <div style={{ marginBottom: "10px" }}>
                <label style={{ marginRight: "10px" }}> 
                    Keywords(複数記載可能、カンマ区切り): 
                </label>
                
                <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>

            <div>
                <button onClick={() => setStart(true)}>Search</button>
            </div>
        </div>
    </div>

    {errorMsg && (
    <div style={{ color: "red", marginTop: "10px" }}>
        {errorMsg}
    </div>
    )}

    <br />

        {hasListed && (
        <>
            <h2> Rakuten Item List </h2>
            <div>
                {items.map((item, index) => { 
                    return (
                        <div key={index}>
                            <p> Item Name: {item.itemName} </p>
                            <p> Item Price: {item.itemPrice} </p>
                            <p>
                                Item URL: 
                                <a href={item.itemUrl} target="_blank" rel="noopener noreferrer">{item.itemUrl}</a>
                            </p>
                        </div>
                    );                    
                })}
            </div>

            <div style={{ marginTop: "20px" }}>
                <h2> Filtered Graph Options </h2>
                <input type="text" placeholder="Shop Name" 
                value={shop_name} onChange={(e) => setShopName(e.target.value)} />
            </div>

            <div>
                <button onClick={() => {
                    setFilterStart(true);
                }}> Generate Filtered Graph 
                </button>
            </div>

            <br />

            {/* Graph Image Display */}
            {graphImagePath && (
                <div>
                    <h2> Item Price Graph </h2>
                    <img 
                        src={graphImagePath} 
                        alt="Rakuten Item Price Graph" 
                        style={{maxWidth: '100%', height: 'auto', border: '1px solid #ccc'}}
                        onLoad={() => console.log("Graph image loaded successfully")}
                        onError={(e) => console.error("Failed to load graph image:", e)}
                    />
                </div>
            )}

            {/* Filter Options */}
            <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ width: "250px", padding: "10px", borderRight: "1px solid #ccc" }}>
                <h2> Filter Options </h2>

                <div> 
                    <label> Min Money: {min_money} </label>
                    <input 
                        type="range" 
                        min="0"
                        max="100000"
                        value={min_money} 
                        onChange={(e) => setMinMoney(e.target.value)} 
                    />
                </div>

                <div>
                    <label> Max Money: {max_money} </label>
                    <input 
                        type="range" 
                        min="0"
                        max="100000"
                        value={max_money} 
                        onChange={(e) => setMaxMoney(e.target.value)} 
                    />
                </div>

                <div>
                    <label> Makers (comma separated): </label>
                    <input type="text" value={makers} onChange={(e) => setMakers(e.target.value)} />
                </div>

            </div>
            </div>
        </>
        )}
    </div>
    );
};



export default RakutenItemUIComponent;