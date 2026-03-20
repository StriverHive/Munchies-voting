// client/src/pages/PublicVotePage.jsx — Midnight Editorial Ballot (public employee-ID flow)
import React, { useState, useCallback, useMemo, useEffect } from "react";
import api from "../api";
import { useParams } from "react-router-dom";
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
  IconIdCard,
  IconUserCircle,
  IconAward,
  IconCheckCircle,
} from "../components/voting/BallotIcons";
import "./PublicVotePage.css";

const PublicVotePage = () => {
  const { voteId } = useParams();

  const [pollSummary, setPollSummary] = useState(null);
  const [pollLoading, setPollLoading] = useState(true);
  const [pollError, setPollError] = useState(false);

  const [step, setStep] = useState("enterEmployeeId");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [voteData, setVoteData] = useState(null);
  const [voter, setVoter] = useState(null);
  const [selectedNomineeIds, setSelectedNomineeIds] = useState([]);
  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [errorText, setErrorText] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      if (!voteId) {
        setPollLoading(false);
        setPollError(true);
        return;
      }
      setPollLoading(true);
      setPollError(false);
      try {
        const res = await api.get(`/votes/${voteId}/public-summary`);
        if (!cancelled) {
          setPollSummary(res.data);
        }
      } catch {
        if (!cancelled) {
          setPollSummary(null);
          setPollError(true);
        }
      } finally {
        if (!cancelled) setPollLoading(false);
      }
    }
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [voteId]);

  const phase = pollSummary?.phase;
  const pollOpen = phase === "open";

  const handleCheckEmployee = async (e) => {
    e?.preventDefault?.();
    const raw = employeeIdInput.trim();
    if (raw.length < 2) {
      setErrorText("Please enter your employee ID (at least 2 characters).");
      return;
    }
    try {
      setChecking(true);
      setErrorText(null);

      const res = await api.post(`/votes/${voteId}/check-employee`, {
        employeeId: raw,
      });

      setVoteData(res.data.vote);
      setVoter(res.data.voter);
      setSelectedNomineeIds([]);
      setStep("voting");
    } catch (error) {
      console.error("Check employee error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Unable to verify your employee ID. Please try again.";
      setErrorText(errorMessage);
    } finally {
      setChecking(false);
    }
  };

  const maxVotes = voteData?.maxVotesPerVoter || 1;

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

  const handleSubmitVote = async () => {
    if (!voteData || !voter) {
      setErrorText(
        "Voting session is not ready. Please refresh the page and try again."
      );
      return;
    }
    if (!selectedNomineeIds || selectedNomineeIds.length === 0) {
      setErrorText("Please select at least one nominee.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorText(null);

      await api.post(`/votes/${voteId}/cast`, {
        employeeId: voter.employeeId,
        nomineeIds: selectedNomineeIds,
      });

      setStep("done");
    } catch (error) {
      console.error("Cast vote error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit your vote. Please try again.";
      setErrorText(errorMessage);
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

  const contextDesc = () => {
    if (step === "done") {
      return "Your vote has been recorded securely.";
    }
    if (step === "voting") {
      return "Review your ballot and submit when ready. Your vote is final once submitted.";
    }
    return "Verify your employee ID to continue.";
  };

  const pollTitle =
    pollSummary?.name ||
    (pollError ? "Ballot unavailable" : "Employee ballot");

  return (
    <div className="ballot-root">
      <div className="ballot-bg" aria-hidden />
      <div className="ballot-vignette" aria-hidden />

      <div className="ballot-shell">
        <aside className="ballot-context">
          <LogoHeader />
          <p className="ballot-eyebrow">
            <IconShield />
            Private employee ballot
          </p>
          {pollLoading ? (
            <div className="ballot-skeleton-title" aria-hidden />
          ) : (
            <h1 className="ballot-poll-title">{pollTitle}</h1>
          )}
          <p className="ballot-context-desc">{contextDesc()}</p>
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
            {pollLoading && (
              <div className="ballot-loading">
                <div className="ballot-spinner" aria-hidden />
                <p className="ballot-loading-text">Loading ballot…</p>
              </div>
            )}

            {!pollLoading && pollError && (
              <div className="ballot-step">
                <div className="ballot-phase-banner" role="alert">
                  This ballot link is invalid or no longer available.
                </div>
                <p className="ballot-helper" style={{ marginTop: 16 }}>
                  Check the link you were sent or contact your organizer.
                </p>
              </div>
            )}

            {!pollLoading && !pollError && !pollOpen && step === "enterEmployeeId" && (
              <div className="ballot-step">
                <div className="ballot-phase-banner" role="status">
                  {phase === "upcoming"
                    ? "Voting has not started yet."
                    : "Voting has ended."}
                </div>
                <p className="ballot-helper" style={{ marginTop: 16 }}>
                  Please return at the time communicated by your team.
                </p>
              </div>
            )}

            {!pollLoading &&
              !pollError &&
              pollOpen &&
              step === "enterEmployeeId" && (
                <div className="ballot-step" key="id">
                  <form onSubmit={handleCheckEmployee} noValidate>
                    <div className="ballot-field">
                      <label className="ballot-label" htmlFor="ballot-employee-id">
                        <IconIdCard />
                        Employee ID
                      </label>
                      <input
                        id="ballot-employee-id"
                        className="ballot-input"
                        placeholder="Enter your employee ID"
                        value={employeeIdInput}
                        onChange={(e) => {
                          setEmployeeIdInput(e.target.value);
                          if (errorText) setErrorText(null);
                        }}
                        autoComplete="username"
                        autoCapitalize="characters"
                        inputMode="text"
                        disabled={checking}
                        aria-invalid={errorText ? "true" : "false"}
                        aria-describedby={
                          errorText ? "ballot-id-error" : "ballot-id-hint"
                        }
                      />
                      <p id="ballot-id-hint" className="ballot-helper">
                        Use the same ID used for scheduling or payroll.
                      </p>
                      {errorText && (
                        <p id="ballot-id-error" className="ballot-field-error">
                          {errorText}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="ballot-btn"
                      disabled={checking}
                    >
                      {checking ? "Verifying…" : "Continue"}
                    </button>
                    <p className="ballot-reassurance">
                      <IconLock />
                      Your ID is only used to verify eligibility for this poll.
                    </p>
                  </form>
                </div>
              )}

            {!pollLoading && !pollError && pollOpen && step === "voting" && voteData && voter && (
              <div className="ballot-step ballot-step--voting" key="vote">
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

                <div className="ballot-receipt">
                  <div className="ballot-receipt-row">
                    <span className="ballot-receipt-icon">
                      <IconAward />
                    </span>
                    <div>
                      <strong>Poll</strong>
                      <div>{voteData.name}</div>
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
                  <p className="ballot-security-note">
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
                    {(voteData.nominees || []).map((nominee, index) => {
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
                    })}
                  </div>
                </div>

                <div className="ballot-inline-submit">
                  <button
                    type="button"
                    className="ballot-btn"
                    onClick={handleSubmitVote}
                    disabled={submitting || selectedNomineeIds.length === 0}
                  >
                    {submitting ? "Submitting…" : "Submit vote"}
                  </button>
                </div>
              </div>
            )}

            {!pollLoading && !pollError && pollOpen && step === "done" && voteData && voter && (
              <div className="ballot-success" key="done">
                <RemoteSuccessLottie />
                <h2 className="ballot-success-title">Vote recorded</h2>
                <p className="ballot-success-lead">
                  Your vote for <strong>{voteData.name}</strong> has been
                  submitted securely.
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
          </div>
        </main>
      </div>

      {!pollLoading && !pollError && pollOpen && step === "voting" && voteData && voter && (
        <div className="ballot-sticky-actions">
          <div className="ballot-sticky-inner">
            <div className="ballot-sticky-meta">
              {selectedNomineeIds.length} of {maxVotes} selected
              {maxVotes > 1 ? " nominees" : " nominee"}
            </div>
            <button
              type="button"
              className="ballot-btn"
              onClick={handleSubmitVote}
              disabled={submitting || selectedNomineeIds.length === 0}
            >
              {submitting ? "Submitting…" : "Submit vote"}
            </button>
          </div>
        </div>
      )}

      <div className="ballot-footer-brand">
        <AppBrandLogo alt="" aria-hidden className="ballot-footer-logo" />
        <span className="ballot-footer-note">
          {BRAND_NAME} · Secure · {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
};

export default PublicVotePage;
