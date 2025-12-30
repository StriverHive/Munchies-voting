// client/src/pages/InviteVotePage.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Alert,
  Checkbox,
  Button,
  Spin,
  message as antMessage,
  Space,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import axios from "axios";

const { Title, Text } = Typography;

const InviteVotePage = () => {
  const { voteId, token } = useParams();

  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState(null);
  const [vote, setVote] = useState(null);
  const [voter, setVoter] = useState(null);
  const [selectedNomineeIds, setSelectedNomineeIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // NEW: flag from backend
  const [isNominee, setIsNominee] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      console.log("InviteVotePage params:", { voteId, token });

      if (!voteId || !token) {
        setInviteError("Invalid voting link (missing parameters).");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setInviteError(null);

        const res = await axios.get(
          `http://localhost:5000/api/votes/${voteId}/invite/${token}`
        );

        console.log("Invite details response:", res.data);

        const voteData = res.data.vote;
        const voterData = res.data.voter;

        setVote(voteData);
        setVoter(voterData);

        // Use backend flag first
        let nomineeFlag = Boolean(voterData && voterData.isNominee);

        // Fallback (in case of older backend): check by employeeId / _id
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
        setInviteError(null);
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

  const handleNomineeChange = (checkedValues) => {
    setSelectedNomineeIds(checkedValues);
  };

  const handleSubmit = async () => {
    if (!vote) return;

    if (selectedNomineeIds.length === 0) {
      antMessage.warning("Please select at least one nominee.");
      return;
    }

    if (selectedNomineeIds.length > vote.maxVotesPerVoter) {
      antMessage.error(
        `You can select up to ${vote.maxVotesPerVoter} nominees.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `http://localhost:5000/api/votes/${voteId}/invite/${token}/cast`,
        {
          nomineeIds: selectedNomineeIds,
        }
      );

      antMessage.success(
        res.data.message || "Your vote has been submitted."
      );
      setHasSubmitted(true);
    } catch (error) {
      console.error("Cast vote with invite error:", error);
      const message =
        error.response?.data?.message ||
        "Failed to submit your vote. Please try again.";
      antMessage.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Spin size="large" />
        <Text style={{ color: "white", marginTop: 16, fontSize: 16 }}>
          Loading voting details...
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background circles */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          filter: "blur(80px)",
        }}
      />

      <Card
        style={{
          width: 720,
          maxWidth: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRadius: 16,
          border: "none",
          background: "white",
          position: "relative",
          zIndex: 1,
        }}
        bodyStyle={{
          padding: 0,
        }}
      >
        {/* Header Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "32px 32px 24px",
            borderRadius: "16px 16px 0 0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 12,
            }}
          >
            🗳️
          </div>
          <Title
            level={2}
            style={{
              color: "white",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Employee Voting Portal
          </Title>
          {!inviteError && !hasSubmitted && (
            <Text
              style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 15 }}
            >
              Your voice matters. Cast your vote below.
            </Text>
          )}
        </div>

        {/* Body Section */}
        <div style={{ padding: 32 }}>
          {/* Error State */}
          {inviteError && (
            <Alert
              type="error"
              showIcon
              style={{
                borderRadius: 8,
                border: "1px solid #ffa39e",
              }}
              message="Unable to Access Voting Link"
              description={inviteError}
            />
          )}

          {/* Success State */}
          {!inviteError && vote && voter && hasSubmitted && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
                }}
              >
                <CheckCircleOutlined
                  style={{ fontSize: 40, color: "white" }}
                />
              </div>

              <Title
                level={3}
                style={{ marginBottom: 12, color: "#1f2937" }}
              >
                Vote Successfully Recorded!
              </Title>

              <Text
                style={{
                  fontSize: 16,
                  color: "#6b7280",
                  display: "block",
                  marginBottom: 24,
                }}
              >
                Thank you,{" "}
                <strong style={{ color: "#1f2937" }}>
                  {voter.firstName} {voter.lastName}
                </strong>{" "}
                ({voter.employeeId})
              </Text>

              <div
                style={{
                  background: "#f9fafb",
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 14, color: "#6b7280" }}>
                  Your vote for{" "}
                  <strong style={{ color: "#1f2937" }}>
                    {vote.name}
                  </strong>{" "}
                  has been securely recorded.
                </Text>
              </div>

              <Text type="secondary" style={{ fontSize: 14 }}>
                You may now close this window or return to your work.
              </Text>
            </div>
          )}

          {/* Voting Form */}
          {!inviteError && vote && voter && !hasSubmitted && (
            <>
              {/* Nominee extra info & list – only if this voter is a nominee */}
              {isNominee && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #ecfeff 0%, #e0f2fe 100%)",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Text
                    strong
                    style={{
                      display: "block",
                      marginBottom: 8,
                      color: "#1d4ed8",
                      fontSize: 14,
                    }}
                  >
                    🎉 You are one of the nominees in this voting cycle.
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#1f2937",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Here is the full nominee list for{" "}
                    <strong>{vote.name}</strong>:
                  </Text>

                  <div
                    style={{
                      maxHeight: 180,
                      overflowY: "auto",
                      background: "white",
                      borderRadius: 8,
                      padding: "8px 12px",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                      }}
                    >
                      {(vote.nominees || []).map((n) => (
                        <li
                          key={n._id}
                          style={{
                            padding: "6px 0",
                            borderBottom: "1px solid #f3f4f6",
                            fontSize: 13,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "#111827",
                              fontWeight: 500,
                            }}
                          >
                            {n.firstName} {n.lastName}
                          </span>
                          <span
                            style={{
                              color: "#6b7280",
                              fontSize: 12,
                            }}
                          >
                            ({n.employeeId})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Voter Information Card */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 24,
                  border: "1px solid #d1d5db",
                }}
              >
                <Space
                  direction="vertical"
                  size={8}
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <TrophyOutlined
                      style={{ color: "#764ba2", fontSize: 16 }}
                    />
                    <Text strong style={{ color: "#374151" }}>
                      Poll:
                    </Text>
                    <Text style={{ color: "#1f2937" }}>
                      {vote.name}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <UserOutlined
                      style={{ color: "#667eea", fontSize: 16 }}
                    />
                    <Text strong style={{ color: "#374151" }}>
                      Voter:
                    </Text>
                    <Text style={{ color: "#1f2937" }}>
                      {voter.firstName} {voter.lastName} (
                      {voter.employeeId})
                    </Text>
                  </div>

                  <Divider style={{ margin: "12px 0" }} />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <InfoCircleOutlined
                      style={{
                        color: "#6b7280",
                        fontSize: 16,
                        marginTop: 2,
                      }}
                    />
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      Select up to{" "}
                      <strong style={{ color: "#374151" }}>
                        {vote.maxVotesPerVoter}
                      </strong>{" "}
                      nominee
                      {vote.maxVotesPerVoter > 1 ? "s" : ""}. Each
                      vote awards{" "}
                      <strong style={{ color: "#374151" }}>
                        {vote.votePoints}
                      </strong>{" "}
                      point
                      {vote.votePoints > 1 ? "s" : ""}.
                    </Text>
                  </div>
                </Space>
              </div>

              {/* Nominees Section */}
              <div style={{ marginBottom: 24 }}>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    color: "#1f2937",
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  Select Your Nominees
                </Text>

                <Checkbox.Group
                  style={{ width: "100%" }}
                  value={selectedNomineeIds}
                  onChange={handleNomineeChange}
                >
                  <div
                    style={{
                      maxHeight: 320,
                      overflowY: "auto",
                      padding: "4px 8px 4px 0",
                    }}
                  >
                    {vote.nominees && vote.nominees.length > 0 ? (
                      vote.nominees.map((nominee) => (
                        <div
                          key={nominee._id}
                          style={{
                            padding: "14px 16px",
                            marginBottom: 8,
                            borderRadius: 8,
                            border: selectedNomineeIds.includes(
                              nominee._id
                            )
                              ? "2px solid #667eea"
                              : "1px solid #e5e7eb",
                            background: selectedNomineeIds.includes(
                              nominee._id
                            )
                              ? "#f0f4ff"
                              : "white",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            const newSelection =
                              selectedNomineeIds.includes(
                                nominee._id
                              )
                                ? selectedNomineeIds.filter(
                                    (id) => id !== nominee._id
                                  )
                                : [
                                    ...selectedNomineeIds,
                                    nominee._id,
                                  ];
                            handleNomineeChange(newSelection);
                          }}
                        >
                          <Checkbox
                            value={nominee._id}
                            style={{ width: "100%" }}
                          >
                            <span
                              style={{
                                fontSize: 15,
                                color: "#1f2937",
                                fontWeight: 500,
                              }}
                            >
                              {nominee.firstName}{" "}
                              {nominee.lastName}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                color: "#6b7280",
                                marginLeft: 8,
                              }}
                            >
                              ({nominee.employeeId})
                            </span>
                          </Checkbox>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 32,
                        }}
                      >
                        <Text type="secondary">
                          No nominees available for this poll.
                        </Text>
                      </div>
                    )}
                  </div>
                </Checkbox.Group>
              </div>

              {/* Submit Button */}
              <Button
                type="primary"
                block
                size="large"
                onClick={handleSubmit}
                loading={submitting}
                disabled={selectedNomineeIds.length === 0}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 8,
                  background:
                    selectedNomineeIds.length > 0
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : undefined,
                  border: "none",
                  boxShadow:
                    selectedNomineeIds.length > 0
                      ? "0 4px 12px rgba(102, 126, 234, 0.4)"
                      : undefined,
                }}
              >
                {submitting ? "Submitting..." : "Submit Vote"}
              </Button>

              {selectedNomineeIds.length > 0 && (
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 12,
                    fontSize: 13,
                  }}
                >
                  {selectedNomineeIds.length} of{" "}
                  {vote.maxVotesPerVoter} nominee
                  {vote.maxVotesPerVoter > 1 ? "s" : ""} selected
                </Text>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InviteVotePage;
