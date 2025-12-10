import { useState, useEffect, useRef } from "react";


// fetch the task list from the backend and display them.(Already working)
function RakutenItemUIComponent ( { onSelect } ) {

    // for listing all items on rakuten
    const [number_hits, setNumberHits] = useState(0);
    const [page, setPage] = useState(0);
    const [max_page, setMaxPage] = useState(0);
    const [keywords, setKeywords] = useState("");


    // for filtering uses
    const [min_money, setMinMoney] = useState(0);
    const [max_money, setMaxMoney] = useState(0);
    const [makers, setMakers] = useState("");
    const [shop_code, setShopCode] = useState("");

    // flag to check if items have been listed
    const [start, setStart] = useState(false);
    const [hasListed, setHasListed] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // full items from rakuten
    const [items, setfullItems] = useState([]);

    const [graphImagePath, setGraphImagePath] = useState("");

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
                        `http://localhost:5000/rakuten/items/listup?number_hits=${number_hits}&page=${page}&max_page=${max_page}&keywords=${keywords}`
                    );
                    const json = await res.json();                    
                    setfullItems(json.results);
                    setHasListed(true);
                    
                    const graphRes = await fetch(
                        `http://localhost:5000/rakuten/items/graph/create?json_data=${encodeURIComponent(JSON.stringify(json.results))}`
                    );

                    const graphBlob = await graphRes.blob();
                    const graphUrl = URL.createObjectURL(graphBlob);
                    setGraphImagePath(graphUrl);


                } catch (err) {
                    console.error("Error fetching items:", err);
                    setHasListed(false);
                } finally {
                    setStart(false);
                }
            }
        };
        if (keywords) {
            fetchItems();
        }
    }, [number_hits, page, max_page, keywords, start]);

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

            {graphImagePath && (
                <div>
                    <h2> Item Price Graph </h2>
                    <img src={graphImagePath} alt="Rakuten Item Price Graph" />
                </div>
            )}

            <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ width: "250px", padding: "10px", borderRight: "1px solid #ccc" }}>
                <h2> Filter Options </h2>

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
        </>
        )}
    </div>
    );
};



export default RakutenItemUIComponent;