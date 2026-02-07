// MAILMAN: The Archival Script
// Usage: node scripts/mailman.js

const fs = require('fs');
const https = require('https');
const path = require('path');

// CONFIG
const YEAR = new Date().getFullYear();
const DATA_FILE = path.join(__dirname, `../data/${YEAR}.js`);
const UPLINK_URL = 'https://script.google.com/macros/s/AKfycbxWvLNwivMBlKL9ODO72RbqKemf-qAAFSIjVK9lNvllPHpZDGnSyEeECQ4r7sADquXr8Q/exec';

console.log(`\n📮 MAILMAN: Checking the mailbox for ${YEAR}...\n`);

// 1. Fetch Data from Uplink
https.get(UPLINK_URL, (res) => {
    // Follow redirects if necessary (Google Scripts usually redirect)
    if (res.statusCode === 302 && res.headers.location) {
        https.get(res.headers.location, processResponse);
    } else {
        processResponse(res);
    }
}).on('error', (e) => {
    console.error("Error fetching mail:", e);
});

function processResponse(res) {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const messages = JSON.parse(rawData);
            if (!messages || messages.length === 0) {
                console.log("📭 Mailbox is empty. No new logs.");
                return;
            }
            console.log(`mw Incoming: ${messages.length} new logs.`);
            processMessages(messages);
        } catch (e) {
            console.error("Error parsing mailbox data:", e.message);
        }
    });
}

function processMessages(newRows) {
    // 2. Read Local Archive
    let fileContent = fs.readFileSync(DATA_FILE, 'utf8');
    
    // Convert Uplink Objects to Array Format
    // Sheet: { date, type, val, note }
    // Local: [ "YYYY-MM-DD", Words, Gym, "Note" ]
    
    let entriesToAdd = [];

    newRows.forEach(row => {
        // Date Parsing
        let d = new Date(row.date);
        let dateStr = !isNaN(d) ? d.toISOString().split('T')[0] : row.date;

        let type = (row.type || "").toLowerCase();
        let content = row.val || ""; 
        let note = row.note || "";
        
        let words = 0;
        let gym = false;
        let finalNote = "";

        // Logic must match loader.js
        if (type === 'writing') {
            words = parseInt(content) || 0;
            finalNote = note; 
        } else if (type === 'gym') {
            gym = true;
            finalNote = content; 
        } else {
            // Log, Movie, Music
            finalNote = content;
            if (note) finalNote += " #" + note; 
        }

        // Create the code string to append
        // We format it nicely for the JS file
        let newEntry = `    ["${dateStr}", ${words}, ${gym}, "${finalNote.replace(/"/g, '\\"')}"]`;
        entriesToAdd.push(newEntry);
    });

    // 3. Append to File
    // We look for the closing bracket "]" of the array.
    // This is a naive but effective strict replace for the specific format.
    
    if (entriesToAdd.length > 0) {
        const insertionPoint = fileContent.lastIndexOf(']');
        if (insertionPoint === -1) {
            console.error("Could not find the end of the array in 2026.js");
            return;
        }

        const before = fileContent.substring(0, insertionPoint);
        const after = fileContent.substring(insertionPoint);
        
        // Check if we need a comma
        const needsComma = before.trim().endsWith(']') || before.trim().endsWith('0') || before.trim().endsWith('""') || before.trim().endsWith('true') || before.trim().endsWith('false');
        
        const newBlock = (needsComma ? ",\n" : "\n") + entriesToAdd.join(",\n");
        const newContent = before + newBlock + "\n" + after;

        fs.writeFileSync(DATA_FILE, newContent);
        console.log(`✅ Archived ${entriesToAdd.length} messages to ${DATA_FILE}`);
        
        console.log("⚠️  Action Required: Verify the file looks good, then commit.");
        console.log("ℹ️  To empty the online mailbox, we need to add a 'clear' function to the Google Script.");
    }
}
