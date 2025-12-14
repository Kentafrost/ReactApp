import { Slider } from "@mui/material";
import { useState, useEffect } from "react";

// rakuten items fetch function
const fetchRakutenItems = async (number_hits, page, max_page, keywords) => {
    const res = await fetch(
        `http://localhost:5000/rakuten/listup?number_hits=${number_hits}&page=${page}&max_page=${max_page}&keywords=${keywords}`
    );
    
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
};


// create graph with optional filters
const createGraph = async (items, shop_name = null, range = null) => {
    const res = await fetch("http://localhost:5000/rakuten/graph/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            json_data: JSON.stringify(items), 
            shop_name: shop_name,
            range: range
        }),
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    return await res.blob();
};


// fetch filter options
const fetchFilterOptions = async (items) => {
    const res = await fetch("http://localhost:5000/rakuten/graph/filter/options", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            json_data: JSON.stringify(items)
        })
    });
    
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
};


// component for rakuten item UI
function SearchForm({ 
    number_hits, setNumberHits, 
    page, setPage, 
    max_page, setMaxPage, 
    keywords, setKeywords, 
    setStart 
}) {
    return (
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
    );
}

// component to display rakuten items list
function ItemsList({ items }) {
    return (
        <div>
            <h2> Rakuten Item List </h2>
            <div>
                {items.map((item, index) => (
                    <div key={index}>
                        <p> Item Name: {item.itemName} </p>
                        <p> Item Price: {item.itemPrice} </p>
                        <p>
                            Item URL: 
                            <a href={item.itemUrl} target="_blank" rel="noopener noreferrer">{item.itemUrl}</a>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}


// component to display graph image
function GraphDisplay({ graphImagePath }) {
    if (!graphImagePath) return null;
    
    return (
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
    );
}


// component for filter options
function FilterOptions({ 
    range, setRange,
    shopsNames, shopName, setShopName,
    setFilterStart
}) {
    return (
        <div>
            <div style={{ marginTop: "20px" }}>
                <h2> Filtered Graph Options </h2>
                <input 
                    type="text" 
                    placeholder="Shop Name" 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)} 
                />
            </div>
            <div>
                <button onClick={() => setFilterStart(true)}>
                    Generate Filtered Graph 
                </button>
            </div>
            <br />
            <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ width: "250px", padding: "10px", borderRight: "1px solid #ccc" }}>
                    
                    <h2> Filter Options </h2>
                    <div style={{ padding: '20px' }}> 
                        <label> Money range: ¥{range[0].toLocaleString()} - ¥{range[1].toLocaleString()} </label>
                        
                        <div style={{ marginTop: '10px' }}>
                            <label>Min Price: ¥</label>
                            <input
                                type="range"
                                min={0}
                                max={100000}
                                step={1000}
                                value={range[0]}
                                onChange={(e) => setRange([parseInt(e.target.value), range[1]])}
                                style={{ width: '200px', marginBottom: '10px' }}
                            />
                            <div>¥{range[0].toLocaleString()}</div>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            <label>Max Price: ¥</label>
                            <input
                                type="range"
                                min={0}
                                max={100000}
                                step={1000}
                                value={range[1]}
                                onChange={(e) => setRange([range[0], parseInt(e.target.value)])}
                                style={{ width: '200px', marginBottom: '10px' }}
                            />
                            <div>¥{range[1].toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: "10px" }}>
                        <h3> Available Shops: </h3>
                        <select value={shopName} onChange={(e) => setShopName(e.target.value)}>
                            <option value="">-- Select Shop --</option>

                            {shopsNames.map((shop, index) => (
                                <option key={index} value={shop}>
                                    {shop}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}


// fetch the task list from the backend and display them.(Already working)
function RakutenItemUIComponent ( { onSelect } ) {

    // for listing all items on rakuten
    const [number_hits, setNumberHits] = useState(10);
    const [page, setPage] = useState(1);
    const [max_page, setMaxPage] = useState(3);
    const [keywords, setKeywords] = useState("Desktop");

    // flag to check if items have been listed
    const [start, setStart] = useState(false);
    const [hasListed, setHasListed] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // full items from rakuten
    const [items, setfullItems] = useState([]);

    const [graphImagePath, setGraphImagePath] = useState("");
    const [filterStart, setFilterStart] = useState(false);

    // graph filter fields
    const [shopName, setShopName] = useState("");
    const [shopsNames, setShopsNames] = useState([]);
    const [range, setRange] = useState([0, 100000]);


    // カスタムフック的な関数
    const handleItemsFetch = async () => {
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

        try {
            const json = await fetchRakutenItems(number_hits, page, max_page, keywords);
            console.log("API Response:", json);
            
            if (json && json.results && Array.isArray(json.results)) {
                setfullItems(json.results);
                setHasListed(true);
                setErrorMsg("");

                if (json.results.length > 0) {
                    console.log("Creating graph with data:", json.results);
                    
                    // グラフとフィルターオプションを並列取得
                    const [graphBlob, FilterOptionsJson] = await Promise.all([
                        createGraph(json.results, null),
                        fetchFilterOptions(json.results)
                    ]);

                    const filterOptions = JSON.stringify(FilterOptionsJson, null, 2);
                    console.log("Filter Options JSON:", filterOptions);

                    const shopsNames = Object.values(FilterOptionsJson.shop_names || {});
                    console.log("Available Shops:", shopsNames);

                    setShopsNames(shopsNames);
                    
                    const graphUrl = URL.createObjectURL(graphBlob);
                    setGraphImagePath(graphUrl);
                    setErrorMsg("");
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
    };

    useEffect(() => {
        if (start && keywords) {
            handleItemsFetch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [number_hits, page, max_page, keywords, start]);

    // custom hook for filtering graph
    const handleGraphFilter = async () => {
        if (!Array.isArray(items) || items.length === 0) {
            console.error("No valid items data for filtering:", items);
            setErrorMsg("No items available for filtering.");
            setFilterStart(false);
            return;
        }

        try {
            console.log("Filtering with shop_name:", shopName, "range:", range, "Items:", items);
            
            const graphBlob = await createGraph(items, shopName || null, range[0], range[1]);
            const graphUrl = URL.createObjectURL(graphBlob);
            console.log("Filtered graph URL:", graphUrl);

            setGraphImagePath(graphUrl);
            setFilterStart(false);
            setErrorMsg("");

        } catch (err) {
            console.error("Error fetching filtered graph:", err);
            setGraphImagePath("");
            setFilterStart(false);
            setErrorMsg(`Error generating filtered graph: ${err.message}`);
        }
    };

    // filtering with shop name
    useEffect(() => {
        if (filterStart && items.length > 0) {
            handleGraphFilter();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStart, shopName, items, range]);

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
            <SearchForm 
                number_hits={number_hits} setNumberHits={setNumberHits}
                page={page} setPage={setPage}
                max_page={max_page} setMaxPage={setMaxPage}
                keywords={keywords} setKeywords={setKeywords}
                setStart={setStart}
            />

            {errorMsg && (
                <div style={{ color: "red", marginTop: "10px" }}>
                    {errorMsg}
                </div>
            )}

            <br />

            {hasListed && (
                <>
                    <ItemsList items={items} />
                    
                    <FilterOptions
                        range = {range} setRange={setRange}
                        shopsNames={shopsNames} shopName={shopName} setShopName={setShopName}
                        setFilterStart={setFilterStart}
                    />

                    <GraphDisplay graphImagePath={graphImagePath} />
                </>
            )}
        </div>
    );
}


export default RakutenItemUIComponent;