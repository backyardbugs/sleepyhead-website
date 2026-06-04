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

  return rows
    .map(r => normalizeRecord_(rowToRecord_(headers, r)))
    .filter(rec => rec.post_slug === postSlug && rec.status === "approved")
    .map(rec => ({
      id: rec.id || "",
      name: rec.name || "Anonymous",
      comment: rec.comment || "",
      created_at: rec.created_at || ""
    }));
}

function addComment_(post, name, comment, hp) {
  if (hp) return { ok: false, error: "Spam detected" };
  if (!post || !name || !comment) return { ok: false, error: "Missing required fields" };

  const nowIso = new Date().toISOString();
  const id = Utilities.getUuid();
  const status = AUTO_APPROVE ? "approved" : "pending";

  const sheet = getSheet_();
  const headers = sheet.getDataRange().getValues()[0].map(h => String(h || "").trim());
  const row = buildRowFromHeaders_(headers, {
    id: id,
    post_slug: post,
    name: name,
    comment: comment,
    status: status,
    created_at: nowIso,
    website: "" // legacy column support
  });
  sheet.appendRow(row);
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

function rowToRecord_(headers, row) {
  const rec = {};
  headers.forEach((h, i) => {
    rec[h] = String(row[i] || "");
  });
  return rec;
}

function normalizeRecord_(rec) {
  const validStatus = rec.status === "approved" || rec.status === "pending";
  const commentLooksLikeStatus = rec.comment === "approved" || rec.comment === "pending";
  const statusLooksLikeDate = /^\d{4}-\d{2}-\d{2}T/.test(rec.status || "");

  // Repair rows written against old header shape where website existed but payload did not include it.
  if (!validStatus && commentLooksLikeStatus && statusLooksLikeDate) {
    rec.created_at = rec.status || rec.created_at || "";
    rec.status = rec.comment;
    rec.comment = rec.website || "";
    rec.website = "";
  }

  return rec;
}

function buildRowFromHeaders_(headers, values) {
  return headers.map(h => {
    return Object.prototype.hasOwnProperty.call(values, h) ? values[h] : "";
  });
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

  const postUrl = `https://sleepyhead.neocities.org/home.html?post=${encodeURIComponent(post)}`;
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
