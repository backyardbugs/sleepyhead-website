/**
 * Global hammer / cookie counters for hammercookie.html
 *
 * Setup:
 * 1. New Google Sheet (e.g. "Sleepyhead hammercookie").
 * 2. Extensions → Apps Script → paste this file.
 * 3. Deploy → New deployment → Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the deployment URL into data/hammercookie-config.json → counterApiUrl
 *
 * Sheet tab "stats" (auto-created):
 *   A1 hammer_count label, B1 cookie_count label
 *   A2 hammer number,      B2 cookie number
 */

var SHEET_NAME = "stats";

function doGet(e) {
  var action = (e.parameter.action || "").trim();
  var callback = (e.parameter.callback || "").trim();

  if (action === "get") {
    return respond_(callback, { ok: true, hammer: getHammer_(), cookie: getCookie_() });
  }

  if (action === "hammer") {
    return respond_(callback, { ok: true, hammer: incrementHammer_() });
  }

  if (action === "cookie") {
    return respond_(callback, { ok: true, cookie: incrementCookie_() });
  }

  return respond_(callback, { ok: false, error: "Unknown action" });
}

function getStatsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange("A1").setValue("hammer_count");
    sheet.getRange("B1").setValue("cookie_count");
    sheet.getRange("A2").setValue(0);
    sheet.getRange("B2").setValue(0);
  }
  return sheet;
}

function getHammer_() {
  var v = getStatsSheet_().getRange("A2").getValue();
  return Math.max(0, parseInt(v, 10) || 0);
}

function getCookie_() {
  var v = getStatsSheet_().getRange("B2").getValue();
  return Math.max(0, parseInt(v, 10) || 0);
}

function incrementHammer_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getStatsSheet_();
    var next = getHammer_() + 1;
    sheet.getRange("A2").setValue(next);
    return next;
  } finally {
    lock.releaseLock();
  }
}

function incrementCookie_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getStatsSheet_();
    var next = getCookie_() + 1;
    sheet.getRange("B2").setValue(next);
    return next;
  } finally {
    lock.releaseLock();
  }
}

function respond_(callback, payload) {
  if (callback) {
    var body = callback + "(" + JSON.stringify(payload) + ");";
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
