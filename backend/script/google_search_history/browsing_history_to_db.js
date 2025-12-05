// import nessesary modules from grand parent directory
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Connect to the SQLite database (or create it if it doesn't exist)
const stmt_create_db = `
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  tag TEXT DEFAULT NULL
)`;


// Function to add browsing history data to the SQLite database
async function add_browsing_history(json_data) {
    /**
     * Function to add browsing history to the SQLite database
     * @param {Array} json_data - Array of browsing history data
     * @returns {void}
     */

    const db = new sqlite3.Database('browsing_history.db');
    db.run(stmt_create_db);

    const stmt_insert = db.prepare("INSERT INTO bookmarks (title, url) VALUES (?, ?)");

    for (const item of json_data) {
        const title = item.title;
        const url = item.url;
        if (title && url) {
            stmt_insert.run([title, url], (err) => {
                if (err) {
                    console.error("Error inserting bookmark:", err);
                }
            });
        }
    }    
    stmt_insert.finalize();
    db.close();
}


function gather_json_data() {
    /** 
    * Function to read JSON file and gather browsing history data
    * @returns {void}
    */

    const current_file_dir = __dirname;
    const json_csv_path = path.join(current_file_dir, "browsing_history.json");

    // Check if the JSON file exists
    fs.access(json_csv_path, fs.constants.F_OK, (err) => {
            if (err) {
            console.error("JSON file does not exist:", json_csv_path);
            return;
        }
    });

    fs.readFile(json_csv_path, 'utf-8', async (err, json_data) => {
        if (err) {
            console.error("Error reading JSON file:", err);
            return;
        }
        const json_data = JSON.parse(json_data);
        await add_browsing_history(json_data);

        console.log("JSON data successfully read and processed.");
        console.log(`Data ${json_data.length} added to the database.`);
    });
}

gather_json_data();
