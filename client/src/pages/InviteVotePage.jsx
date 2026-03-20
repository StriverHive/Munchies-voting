// client/src/pages/InviteVotePage.jsx — Midnight Editorial Ballot (personal invite link)
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import {
  LogoHeader,
  RemoteSuccessLottie,
  initials,
  nomineeAvatarClass,
} from "../components/voting/VotingUiShared";
import AppBrandLogo, { BRAND_NAME } from "../components/AppBrandLogo";
import {
  IconShield,
  IconLock,
  IconClock,
  IconUserCircle,
  IconAward,
  IconCheckCircle,
} from "../components/voting/BallotIcons";
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
          error.response?.data?.message || "Invalid or expired voting link.";
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

  const ruleLine =
    maxVotes === 1
      ? "Select 1 nominee"
      : `Select up to ${maxVotes} nominees`;

  const ruleDetail =
    maxVotes === 1
      ? `Each selection awards ${votePoints} point${votePoints > 1 ? "s" : ""}.`
      : `Up to ${maxVotes} nominees. Each vote awards ${votePoints} point${votePoints > 1 ? "s" : ""}.`;

  const pollTitle =
    vote?.name ||
    (inviteError && !vote ? "Ballot unavailable" : "Private ballot");

  const ballotActive =
    Boolean(vote && voter && !hasSubmitted && !loading);

  const renderContextCopy = () => {
    if (loading) {
      return (
        <p className="ballot-context-desc ballot-context-desc--sub">
          Preparing your secure ballot…
        </p>
      );
    }
    if (hasSubmitted && vote && voter) {
      return (
        <p className="ballot-context-desc">
          Your vote has been recorded securely.
        </p>
      );
    }
    if (inviteError && !vote) {
      return (
        <p className="ballot-context-desc">
          This link may be invalid or expired.
        </p>
      );
    }
    return (
      <>
        <p className="ballot-context-desc ballot-context-desc--lead">
          You&apos;re verified. Complete your ballot below.
        </p>
        <p className="ballot-context-desc ballot-context-desc--sub">
          Your vote is final once submitted.
        </p>
      </>
    );
  };

  return (
    <div
      className={`ballot-root${ballotActive ? " ballot-root--ballot-active" : ""}`}
    >
      <div className="ballot-bg" aria-hidden />
      <div className="ballot-vignette" aria-hidden />

      <div className="ballot-shell">
        <aside className="ballot-context">
          <LogoHeader />
          <p className="ballot-eyebrow">
            <IconShield />
            Private invite ballot
          </p>
          {loading ? (
            <div className="ballot-skeleton-title" aria-hidden />
          ) : (
            <h1 className="ballot-poll-title">{pollTitle}</h1>
          )}
          {renderContextCopy()}
          <div className="ballot-trust-chips">
            <span className="ballot-chip">
              <IconLock />
              Private
            </span>
            <span className="ballot-chip">
              <IconClock />
              ~ 1 min
            </span>
            <span className="ballot-chip">
              <IconCheckCircle />
              Secure submission
            </span>
          </div>
        </aside>

        <main className="ballot-main">
          <div className="ballot-card">
            {loading && (
              <div className="ballot-loading">
                <div className="ballot-spinner" aria-hidden />
                <p className="ballot-loading-text">Loading ballot…</p>
              </div>
            )}

            {!loading && inviteError && !vote && (
              <div className="ballot-step">
                <div className="ballot-phase-banner" role="alert">
                  Unable to open this invite
                </div>
                <p className="ballot-helper" style={{ marginTop: 16 }}>
                  {inviteError}
                </p>
              </div>
            )}

            {!loading && vote && voter && hasSubmitted && (
              <div className="ballot-success">
                <RemoteSuccessLottie />
                <h2 className="ballot-success-title">Vote recorded</h2>
                <p className="ballot-success-lead">
                  Your vote for <strong>{vote.name}</strong> has been submitted
                  securely.
                </p>
                <p className="ballot-success-detail">
                  Thank you, {voter.firstName} {voter.lastName}.
                </p>
                <p className="ballot-success-detail">
                  You can now close this page.
                </p>
                <p className="ballot-success-foot">
                  <IconShield />
                  Encrypted, one-time submission for this poll.
                </p>
              </div>
            )}

            {!loading && vote && voter && !hasSubmitted && (
              <div className="ballot-step ballot-step--voting">
                {errorText && (
                  <div className="ballot-alert" role="alert">
                    <span style={{ flex: 1 }}>{errorText}</span>
                    <button
                      type="button"
                      className="ballot-dismiss"
                      aria-label="Dismiss"
                      onClick={() => setErrorText(null)}
                    >
                      ×
                    </button>
                  </div>
                )}

                {isNominee && (
                  <div className="ballot-nominee-banner">
                    <strong>You’re a nominee in this poll</strong>
                    <span>
                      Everyone on the ballot for{" "}
                      <strong>{vote.name}</strong>:
                    </span>
                    <ul className="ballot-nominee-list-mini">
                      {(vote.nominees || []).map((n) => (
                        <li key={n._id}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--ballot-text)",
                            }}
                          >
                            {n.firstName} {n.lastName}
                          </span>
                          <span
                            style={{
                              color: "var(--ballot-muted)",
                              fontSize: "0.75rem",
                            }}
                          >
                            {n.employeeId}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="ballot-receipt">
                  <div className="ballot-receipt-row">
                    <span className="ballot-receipt-icon">
                      <IconAward />
                    </span>
                    <div>
                      <strong>Poll</strong>
                      <div>{vote.name}</div>
                    </div>
                  </div>
                  <div className="ballot-receipt-row">
                    <span className="ballot-receipt-icon">
                      <IconUserCircle />
                    </span>
                    <div>
                      <strong>Verified voter</strong>
                      <div>
                        {voter.firstName} {voter.lastName}{" "}
                        <span style={{ color: "var(--ballot-muted)" }}>
                          ({voter.employeeId})
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="ballot-rule-line">{ruleLine}</p>
                  <p className="ballot-security-note">{ruleDetail}</p>
                  <p className="ballot-security-note" style={{ marginTop: 8 }}>
                    Your vote is final once submitted and stored securely.
                  </p>
                </div>

                <div className="ballot-nominee-scroll">
                  <div className="ballot-select-strip">
                    {selectedNomineeIds.length >= maxVotes
                      ? `${maxVotes} of ${maxVotes} selected`
                      : maxVotes === 1
                        ? "Choose 1 nominee"
                        : `Choose up to ${maxVotes} nominees`}{" "}
                    · {selectedNomineeIds.length} selected
                  </div>

                  <div className="ballot-nominees" role="group" aria-label="Nominees">
                    {vote.nominees && vote.nominees.length > 0 ? (
                      vote.nominees.map((nominee, index) => {
                        const idStr = String(nominee._id);
                        const selected = selectedSet.has(idStr);
                        return (
                          <button
                            key={nominee._id}
                            type="button"
                            className={`ballot-nominee${selected ? " ballot-nominee--selected" : ""}`}
                            onClick={() => toggleNominee(nominee._id)}
                            aria-pressed={selected}
                          >
                            <div
                              className={nomineeAvatarClass(index)}
                              aria-hidden
                            >
                              {initials(nominee.firstName, nominee.lastName)}
                            </div>
                            <div className="ballot-nominee-text">
                              <p className="ballot-nominee-name">
                                {nominee.firstName} {nominee.lastName}
                              </p>
                              <p className="ballot-nominee-id">
                                ID {nominee.employeeId}
                              </p>
                            </div>
                            <span className="ballot-nominee-check" aria-hidden>
                              <IconCheckCircle filled={selected} />
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="ballot-empty">No nominees in this poll.</div>
                    )}
                  </div>
                </div>

                <div className="ballot-inline-submit">
                  <button
                    type="button"
                    className="ballot-btn"
                    onClick={handleSubmit}
                    disabled={submitting || selectedNomineeIds.length === 0}
                  >
                    {submitting ? "Submitting…" : "Submit vote"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {!loading && vote && voter && !hasSubmitted && (
        <div className="ballot-sticky-actions">
          <div className="ballot-sticky-inner">
            <span className="ballot-sr-only" aria-live="polite">
              {selectedNomineeIds.length} of {maxVotes} nominee
              {maxVotes > 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              className="ballot-btn"
              onClick={handleSubmit}
              disabled={submitting || selectedNomineeIds.length === 0}
              aria-label={
                submitting
                  ? "Submitting vote"
                  : `Submit vote, ${selectedNomineeIds.length} of ${maxVotes} selected`
              }
            >
              {submitting ? "Submitting…" : "Submit vote"}
            </button>
          </div>
        </div>
      )}

      <div className="ballot-footer-wrap">
        <div className="ballot-footer-brand">
          <AppBrandLogo alt="" aria-hidden className="ballot-footer-logo" />
          <span className="ballot-footer-note">
            {BRAND_NAME} · Secure · {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default InviteVotePage;
