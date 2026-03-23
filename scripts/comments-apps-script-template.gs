/**
 * Apps Script template for anonymous comments.
 *
 * Sheet columns (header row):
 * id,post_slug,name,comment,status,created_at
 *
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const SHEET_NAME = "comments";
const AUTO_APPROVE = true; // true = comments show immediately
const ADMIN_EMAIL = ""; // e.g. "you@example.com" (leave blank to disable email alerts)

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
    const comment = (e.parameter.comment || "").trim();
    const hp = (e.parameter.hp || "").trim();

    const result = addComment_(post, name, comment, hp);
    return respond_(callback, result);
  }

  return respond_(callback, { ok: false, error: "Unknown action" });
}

function getComments_(postSlug) {
  if (!postSlug) return [];

  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h || "").trim());
  const rows = values.slice(1);
  const idx = indexMap_(headers);

  return rows
    .filter(r => String(r[idx.post_slug] || "") === postSlug && String(r[idx.status] || "") === "approved")
    .map(r => ({
      id: String(r[idx.id] || ""),
      name: String(r[idx.name] || "Anonymous"),
      comment: String(r[idx.comment] || ""),
      created_at: String(r[idx.created_at] || "")
    }));
}

function addComment_(post, name, comment, hp) {
  if (hp) return { ok: false, error: "Spam detected" };
  if (!post || !name || !comment) return { ok: false, error: "Missing required fields" };

  const nowIso = new Date().toISOString();
  const id = Utilities.getUuid();
  const status = AUTO_APPROVE ? "approved" : "pending";

  getSheet_().appendRow([id, post, name, comment, status, nowIso]);
  notifyAdmin_(id, post, name, comment, status, nowIso);
  return { ok: true, status: status };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "post_slug", "name", "comment", "status", "created_at"]);
  }
  return sheet;
}

function indexMap_(headers) {
  function at(name, fallback) {
    const i = headers.indexOf(name);
    return i === -1 ? fallback : i;
  }
  return {
    id: at("id", 0),
    post_slug: at("post_slug", 1),
    name: at("name", 2),
    comment: at("comment", 3),
    status: at("status", 4),
    created_at: at("created_at", 5)
  };
}

function respond_(callback, payload) {
  if (callback) {
    const body = `${callback}(${JSON.stringify(payload)});`;
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function notifyAdmin_(id, post, name, comment, status, createdAt) {
  if (!ADMIN_EMAIL) return;

  const postUrl = `https://sleepyhead.neocities.org/index.html?post=${encodeURIComponent(post)}`;
  const subject = `[Sleepyhead] New comment on ${post}`;
  const body = [
    "A new comment was received.",
    "",
    `Post slug: ${post}`,
    `Post URL: ${postUrl}`,
    `Name: ${name}`,
    `Status: ${status}`,
    `Created: ${createdAt}`,
    `ID: ${id}`,
    "",
    "Comment:",
    comment
  ].join("\n");

  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
}
