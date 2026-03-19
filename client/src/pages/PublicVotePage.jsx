// client/src/pages/PublicVotePage.jsx — immersive mobile-first voting UI
import React, { useState, useCallback, useMemo } from "react";
import api from "../api";
import { useParams } from "react-router-dom";
import {
  LogoHeader,
  RemoteSuccessLottie,
  initials,
  hueFromString,
} from "../components/voting/VotingUiShared";
import AppBrandLogo, { BRAND_NAME } from "../components/AppBrandLogo";
import "./PublicVotePage.css";

const PublicVotePage = () => {
  const { voteId } = useParams();

  const [step, setStep] = useState("enterEmployeeId");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [voteData, setVoteData] = useState(null);
  const [voter, setVoter] = useState(null);
  const [selectedNomineeIds, setSelectedNomineeIds] = useState([]);
  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [errorText, setErrorText] = useState(null);

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

  return (
    <div className="pv-root">
      <div className="pv-bg" aria-hidden />
      <div className="pv-orbs" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className="pv-inner">
        <header className="pv-header">
          <p className="pv-kicker">Secure ballot</p>
          <LogoHeader />
          <h1 className="pv-title">Employee Voting Portal</h1>
          <p className="pv-subtitle">
            Your voice matters. Verify your ID, then cast your vote in a few
            taps — optimized for your phone.
          </p>
        </header>

        <div className="pv-card">
          {step === "enterEmployeeId" && (
            <div className="pv-step" key="id">
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

              <form onSubmit={handleCheckEmployee}>
                <label className="pv-label" htmlFor="pv-employee-id">
                  Employee ID
                </label>
                <input
                  id="pv-employee-id"
                  className="pv-input"
                  placeholder="e.g. 5555 or EMP-001"
                  value={employeeIdInput}
                  onChange={(e) => setEmployeeIdInput(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="characters"
                  inputMode="text"
                  disabled={checking}
                />
                <button
                  type="submit"
                  className="pv-btn"
                  disabled={checking}
                >
                  {checking ? "Verifying…" : "Continue to vote"}
                </button>
              </form>
            </div>
          )}

          {step === "voting" && voteData && voter && (
            <div className="pv-step" key="vote">
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

              <div className="pv-meta">
                <div className="pv-meta-row">
                  <span className="pv-meta-icon" aria-hidden>
                    🏆
                  </span>
                  <div>
                    <strong>Poll</strong>
                    <div style={{ color: "var(--pv-muted)", marginTop: 2 }}>
                      {voteData.name}
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
                      <span style={{ opacity: 0.85 }}>
                        ({voter.employeeId})
                      </span>
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
                      Select up to {maxVotes} nominee
                      {maxVotes > 1 ? "s" : ""}. Each choice awards{" "}
                      {voteData.votePoints || 1} point
                      {(voteData.votePoints || 1) > 1 ? "s" : ""}.
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="pv-section-title">Select your nominee(s)</h2>
              <div className="pv-nominees" role="group" aria-label="Nominees">
                {(voteData.nominees || []).map((nominee) => {
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
                        <p className="pv-nominee-id">
                          ID {nominee.employeeId}
                        </p>
                      </div>
                      <span className="pv-check" aria-hidden>
                        {selected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="pv-counter">
                {selectedNomineeIds.length} of {maxVotes} nominee
                {maxVotes > 1 ? "s" : ""} selected
              </p>

              <button
                type="button"
                className="pv-btn"
                onClick={handleSubmitVote}
                disabled={submitting || selectedNomineeIds.length === 0}
              >
                {submitting ? "Submitting…" : "Submit vote"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="pv-step pv-success" key="done">
              <RemoteSuccessLottie />
              <h2 className="pv-success-title">Thank you!</h2>
              <p className="pv-success-msg">
                Your vote was recorded successfully. Thank you for
                participating — you can close this page when you&apos;re done.
              </p>
            </div>
          )}
        </div>

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
};

export default PublicVotePage;
