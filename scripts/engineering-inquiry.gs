/**
 * Google Apps Script — engineering inquiry inbox (optional).
 *
 * 1. Create a new Google Sheet for inquiries.
 * 2. In Extensions → Apps Script, paste this file.
 * 3. Set SHEET_ID to your spreadsheet ID (from the URL).
 * 4. Run setupEngineeringSheet once (authorize).
 * 5. Deploy → New deployment → Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Put the web app URL in data/engineering-config.json as "inquiryEndpoint".
 *
 * Note: Cross-origin fetch from a static site to Apps Script often hits browser CORS limits.
 * For the least friction, use formSubmitEmail in engineering-config.json (FormSubmit) instead;
 * keep this script if you prefer Sheet rows and can call the URL from a context without CORS
 * (e.g. server, or a same-origin proxy).
 */

var SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

function doPost(e) {
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    sheet.appendRow([
      new Date(),
      body.name || '',
      body.email || '',
      body.serviceType || '',
      body.timeline || '',
      body.budget || '',
      body.referenceLinks || '',
      body.message || ''
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Run once: creates header row on the first sheet. */
function setupEngineeringSheet() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  sheet.clear();
  sheet.appendRow(['Received At', 'Name', 'Email', 'Service', 'Timeline', 'Budget', 'Links', 'Message']);
}
