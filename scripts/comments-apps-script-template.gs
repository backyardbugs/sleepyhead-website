/**
 * Apps Script template for anonymous comments.
 *
 * Sheet columns (header row):
 * id,post_slug,name,website,comment,status,created_at
 *
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const SHEET_NAME = "comments";

function doGet(e) {
  const action = (e.parameter.action || "").trim();
  const callback = (e.parameter.callback || "").trim();

  if (action === "getComments") {
    const post = (e.parameter.post || "").trim();
    return respond_(callback, { ok: true, comments: getComments_(post) });
  }

  if (action === "addComment") {
    const post = (e.parameter.post || "").trim();
    const name = (e.parameter.name || "").trim();
    const website = (e.parameter.website || "").trim();
    const comment = (e.parameter.comment || "").trim();
    const hp = (e.parameter.hp || "").trim();

    const result = addComment_(post, name, website, comment, hp);
    return respond_(callback, result);
  }

  return respond_(callback, { ok: false, error: "Unknown action" });
}

function getComments_(postSlug) {
  if (!postSlug) return [];

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const rows = values.slice(1);
  return rows
    .filter(r => String(r[1] || "") === postSlug && String(r[5] || "") === "approved")
    .map(r => ({
      id: String(r[0] || ""),
      name: String(r[2] || "Anonymous"),
      website: String(r[3] || ""),
      comment: String(r[4] || ""),
      created_at: String(r[6] || "")
    }));
}

function addComment_(post, name, website, comment, hp) {
  if (hp) return { ok: false, error: "Spam detected" };
  if (!post || !name || !comment) return { ok: false, error: "Missing required fields" };

  const nowIso = new Date().toISOString();
  const id = Utilities.getUuid();
  const status = "pending"; // switch to "approved" for auto-approve

  getSheet_().appendRow([id, post, name, website, comment, status, nowIso]);
  return { ok: true, status: status };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "post_slug", "name", "website", "comment", "status", "created_at"]);
  }
  return sheet;
}

function respond_(callback, payload) {
  if (callback) {
    const body = `${callback}(${JSON.stringify(payload)});`;
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
