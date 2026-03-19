// client/src/pages/InviteVotePage.jsx — same immersive UI as public vote (invite link)
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import {
  LogoHeader,
  RemoteSuccessLottie,
  initials,
  hueFromString,
} from "../components/voting/VotingUiShared";
import AppBrandLogo, { BRAND_NAME } from "../components/AppBrandLogo";
import "./PublicVotePage.css";

const InviteVotePage = () => {
  const { voteId, token } = useParams();

  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState(null);
  const [vote, setVote] = useState(null);
  const [voter, setVoter] = useState(null);
  const [selectedNomineeIds, setSelectedNomineeIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isNominee, setIsNominee] = useState(false);
  const [errorText, setErrorText] = useState(null);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!voteId || !token) {
        setInviteError("Invalid voting link (missing parameters).");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setInviteError(null);

        const res = await api.get(`/votes/${voteId}/invite/${token}`);
        const voteData = res.data.vote;
        const voterData = res.data.voter;

        setVote(voteData);
        setVoter(voterData);

        let nomineeFlag = Boolean(voterData && voterData.isNominee);

        if (!nomineeFlag && voteData && voteData.nominees && voterData) {
          nomineeFlag = (voteData.nominees || []).some((n) => {
            const byEmployeeId =
              n.employeeId && voterData.employeeId
                ? String(n.employeeId) === String(voterData.employeeId)
                : false;
            const byId =
              n._id && voterData._id
                ? String(n._id) === String(voterData._id)
                : false;
            return byEmployeeId || byId;
          });
        }

        setIsNominee(nomineeFlag);
      } catch (error) {
        console.error("Invite details error:", error);
        const message =
          error.response?.data?.message ||
          "Invalid or expired voting link.";
        setInviteError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [voteId, token]);

  const maxVotes = vote?.maxVotesPerVoter || 1;
  const votePoints = vote?.votePoints ?? 1;

  const toggleNominee = useCallback(
    (id) => {
      const sid = String(id);
      setSelectedNomineeIds((prev) => {
        const has = prev.some((x) => String(x) === sid);
        if (has) {
          setErrorText(null);
          return prev.filter((x) => String(x) !== sid);
        }
        if (prev.length >= maxVotes) {
          setErrorText(
            `You can select up to ${maxVotes} nominee${maxVotes > 1 ? "s" : ""} only.`
          );
          return prev;
        }
        setErrorText(null);
        return [...prev, id];
      });
    },
    [maxVotes]
  );

  const handleSubmit = async () => {
    if (!vote) return;
    if (selectedNomineeIds.length === 0) {
      setErrorText("Please select at least one nominee.");
      return;
    }
    if (selectedNomineeIds.length > maxVotes) {
      setErrorText(
        `You can select up to ${maxVotes} nominee${maxVotes > 1 ? "s" : ""}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorText(null);
      await api.post(`/votes/${voteId}/invite/${token}/cast`, {
        nomineeIds: selectedNomineeIds,
      });
      setHasSubmitted(true);
    } catch (error) {
      console.error("Cast vote with invite error:", error);
      const message =
        error.response?.data?.message ||
        "Failed to submit your vote. Please try again.";
      setErrorText(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSet = useMemo(
    () => new Set(selectedNomineeIds.map((x) => String(x))),
    [selectedNomineeIds]
  );

  const shell = (cardBody) => (
    <div className="pv-root">
      <div className="pv-bg" aria-hidden />
      <div className="pv-orbs" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="pv-inner">
        <header className="pv-header">
          <p className="pv-kicker">Personal invite</p>
          <LogoHeader />
          <h1 className="pv-title">Employee Voting Portal</h1>
          <p className="pv-subtitle">
            {inviteError || hasSubmitted
              ? `Thanks for using ${BRAND_NAME}.`
              : "Your voice matters. Cast your vote below — quick and mobile-friendly."}
          </p>
        </header>
        <div className="pv-card">{cardBody}</div>
        <div className="pv-footer-brand">
          <AppBrandLogo
            alt=""
            aria-hidden
            className="pv-footer-logo"
          />
          <span className="pv-footer-note">
            {BRAND_NAME} · Secure · {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="pv-step">
        <div className="pv-loading-wrap">
          <div className="pv-spinner" aria-hidden />
          <p className="pv-loading-text">Loading voting details…</p>
        </div>
      </div>
    );
  }

  if (inviteError && !vote) {
    return shell(
      <div className="pv-step">
        <div className="pv-error" role="alert">
          <span className="pv-error-icon" aria-hidden>
            ⚠
          </span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: "block", marginBottom: 6 }}>
              Unable to open this link
            </strong>
            {inviteError}
          </div>
        </div>
      </div>
    );
  }

  if (vote && voter && hasSubmitted) {
    return shell(
      <div className="pv-step pv-success">
        <RemoteSuccessLottie />
        <h2 className="pv-success-title">Vote recorded</h2>
        <p className="pv-success-msg">
          Thank you,{" "}
          <strong>
            {voter.firstName} {voter.lastName}
          </strong>{" "}
          ({voter.employeeId}). Your choices for{" "}
          <strong>{vote.name}</strong> were saved securely. You can close this
          tab.
        </p>
      </div>
    );
  }

  return shell(
    <div className="pv-step">
      {errorText && (
        <div className="pv-error" role="alert">
          <span className="pv-error-icon" aria-hidden>
            ⚠
          </span>
          <span style={{ flex: 1 }}>{errorText}</span>
          <button
            type="button"
            className="pv-dismiss"
            aria-label="Dismiss"
            onClick={() => setErrorText(null)}
          >
            ×
          </button>
        </div>
      )}

      {isNominee && (
        <div className="pv-nominee-banner">
          <strong>🎉 You&apos;re a nominee in this poll</strong>
          <span>
            Here is everyone on the ballot for <strong>{vote.name}</strong>:
          </span>
          <ul className="pv-nominee-list-mini">
            {(vote.nominees || []).map((n) => (
              <li key={n._id}>
                <span style={{ fontWeight: 600, color: "var(--pv-text)" }}>
                  {n.firstName} {n.lastName}
                </span>
                <span style={{ color: "var(--pv-muted)", fontSize: "0.75rem" }}>
                  {n.employeeId}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pv-meta">
        <div className="pv-meta-row">
          <span className="pv-meta-icon" aria-hidden>
            🏆
          </span>
          <div>
            <strong>Poll</strong>
            <div style={{ color: "var(--pv-muted)", marginTop: 2 }}>
              {vote.name}
            </div>
          </div>
        </div>
        <div className="pv-meta-row">
          <span className="pv-meta-icon" aria-hidden>
            👤
          </span>
          <div>
            <strong>Voter</strong>
            <div style={{ color: "var(--pv-muted)", marginTop: 2 }}>
              {voter.firstName} {voter.lastName}{" "}
              <span style={{ opacity: 0.85 }}>({voter.employeeId})</span>
            </div>
          </div>
        </div>
        <div className="pv-meta-row">
          <span className="pv-meta-icon" aria-hidden>
            ℹ️
          </span>
          <div>
            <strong>Rules</strong>
            <div style={{ color: "var(--pv-muted)", marginTop: 2 }}>
              Select up to {maxVotes} nominee{maxVotes > 1 ? "s" : ""}. Each
              vote awards {votePoints} point{votePoints > 1 ? "s" : ""}.
            </div>
          </div>
        </div>
      </div>

      <h2 className="pv-section-title">Select your nominee(s)</h2>
      <div className="pv-nominees" role="group" aria-label="Nominees">
        {vote.nominees && vote.nominees.length > 0 ? (
          vote.nominees.map((nominee) => {
            const idStr = String(nominee._id);
            const selected = selectedSet.has(idStr);
            const hue = hueFromString(
              `${nominee.employeeId}-${nominee.firstName}`
            );
            return (
              <button
                key={nominee._id}
                type="button"
                className={`pv-nominee${selected ? " pv-nominee--selected" : ""}`}
                onClick={() => toggleNominee(nominee._id)}
                aria-pressed={selected}
              >
                <div
                  className="pv-avatar"
                  style={{
                    background: `linear-gradient(145deg, hsl(${hue}, 62%, 48%), hsl(${(hue + 40) % 360}, 55%, 42%))`,
                  }}
                >
                  {initials(nominee.firstName, nominee.lastName)}
                </div>
                <div className="pv-nominee-text">
                  <p className="pv-nominee-name">
                    {nominee.firstName} {nominee.lastName}
                  </p>
                  <p className="pv-nominee-id">ID {nominee.employeeId}</p>
                </div>
                <span className="pv-check" aria-hidden>
                  {selected ? "✓" : ""}
                </span>
              </button>
            );
          })
        ) : (
          <div className="pv-empty-nominees">No nominees in this poll.</div>
        )}
      </div>

      <p className="pv-counter">
        {selectedNomineeIds.length} of {maxVotes} nominee
        {maxVotes > 1 ? "s" : ""} selected
      </p>

      <button
        type="button"
        className="pv-btn"
        onClick={handleSubmit}
        disabled={submitting || selectedNomineeIds.length === 0}
      >
        {submitting ? "Submitting…" : "Submit vote"}
      </button>
    </div>
  );
};

export default InviteVotePage;
