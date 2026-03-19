// server/utils/emailLog.js — structured logs for email sends (Render / debugging)

/** Set EMAIL_LOG_EACH_SEND=true to log every successful send (verbose for large batches). */
const LOG_EACH_SUCCESS = process.env.EMAIL_LOG_EACH_SEND === "true";

/**
 * Human-readable + machine-friendly SMTP / transport error details
 */
function formatEmailSendError(err) {
  if (!err) return "unknown error";
  const parts = [err.message || String(err)];
  if (err.code) parts.push(`code=${err.code}`);
  if (err.command) parts.push(`command=${err.command}`);
  if (err.responseCode) parts.push(`smtpResponse=${err.responseCode}`);
  if (err.response) parts.push(`response=${String(err.response).slice(0, 200)}`);
  return parts.join(" | ");
}

function redactTo(to) {
  if (!to) return "(none)";
  if (Array.isArray(to)) return `[${to.length} recipients]`;
  const s = String(to);
  const at = s.indexOf("@");
  if (at < 1) return s.slice(0, 20) + (s.length > 20 ? "…" : "");
  return `${s.slice(0, 2)}***@${s.slice(at + 1)}`;
}

function logEmailSendStart(meta, to, subject) {
  const ctx = meta.context || "email";
  const extra = meta.voteId ? ` voteId=${meta.voteId}` : "";
  const emp = meta.employeeId ? ` employeeId=${meta.employeeId}` : "";
  console.log(
    `[EMAIL] SEND_START context=${ctx}${extra}${emp} to=${redactTo(to)} subject="${String(subject).slice(0, 80)}${String(subject).length > 80 ? "…" : ""}"`
  );
}

function logEmailSendOk(meta, to, ms, info) {
  const ctx = meta.context || "email";
  const mid = info && info.messageId ? info.messageId : "n/a";
  if (LOG_EACH_SUCCESS) {
    console.log(
      `[EMAIL] SEND_OK context=${ctx} to=${redactTo(to)} ms=${ms} messageId=${mid}`
    );
  }
}

function logEmailSendFail(meta, to, ms, err) {
  const ctx = meta.context || "email";
  const detail = formatEmailSendError(err);
  console.error(
    `[EMAIL] SEND_FAIL context=${ctx} to=${redactTo(to)} ms=${ms} reason=${detail}`
  );
}

/**
 * After a bulk send loop: totals + reason breakdown + sample rows
 */
function logEmailBatchSummary(context, { voteId, locationLabel, total, successCount, failureCount, errors }) {
  const loc = locationLabel ? ` location=${locationLabel}` : "";
  console.log(
    `[EMAIL] BATCH_DONE context=${context} voteId=${voteId || "n/a"}${loc} total=${total} success=${successCount} failed=${failureCount}`
  );

  if (!failureCount || !errors || errors.length === 0) return;

  const byReason = {};
  for (const e of errors) {
    const r = (e.reason || "unknown").slice(0, 120);
    byReason[r] = (byReason[r] || 0) + 1;
  }
  console.log(`[EMAIL] BATCH_FAIL_REASONS context=${context} ` + JSON.stringify(byReason));

  const sample = errors.slice(0, 15);
  console.log(
    `[EMAIL] BATCH_FAIL_SAMPLE context=${context} (showing ${sample.length}/${errors.length}) ` +
      JSON.stringify(sample)
  );
}

module.exports = {
  formatEmailSendError,
  redactTo,
  LOG_EACH_SUCCESS,
  logEmailSendStart,
  logEmailSendOk,
  logEmailSendFail,
  logEmailBatchSummary,
};
