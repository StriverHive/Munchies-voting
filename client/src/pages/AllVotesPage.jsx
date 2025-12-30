import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  BarChartOutlined,
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Radio } from "antd";
import API_BASE_URL from "../config/api";

const { Title, Text } = Typography;
const { confirm } = Modal;

const API_BASE = API_BASE_URL;

const formatDateTimeUK = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "-";
  }
};

const renderStatusTag = (record) => {
  const baseStyle = {
    borderRadius: 16,
    padding: "0 12px",
    fontSize: 12,
  };

  if (record.hasEnded) {
    return (
      <Tag color="red" style={baseStyle}>
        Ended
      </Tag>
    );
  }
  if (record.isActive) {
    return (
      <Tag color="green" style={baseStyle}>
        Active
      </Tag>
    );
  }
  if (record.hasStarted && !record.isActive) {
    return (
      <Tag color="orange" style={baseStyle}>
        Closing Soon
      </Tag>
    );
  }
  return (
    <Tag color="default" style={baseStyle}>
      Upcoming
    </Tag>
  );
};

const AllVotesPage = () => {
  const navigate = useNavigate();

  const [votes, setVotes] = useState([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

  const [sendingInviteId, setSendingInviteId] = useState(null);
  const [deletingVoteId, setDeletingVoteId] = useState(null);

  // Winner modal state
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);
  const [winnerModalLoading, setWinnerModalLoading] = useState(false);
  const [currentWinnerVote, setCurrentWinnerVote] = useState(null);
  const [winnerData, setWinnerData] = useState(null);

  // Send-invites modal state
  const [sendInvitesModalVisible, setSendInvitesModalVisible] = useState(false);
  const [sendInvitesModalLoading, setSendInvitesModalLoading] =
    useState(false);
  const [currentVoteForInvites, setCurrentVoteForInvites] = useState(null);
  const [sendModeSelection, setSendModeSelection] = useState("all");
  const [selectedInviteEmployeeIds, setSelectedInviteEmployeeIds] = useState(
    []
  );

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch votes
  const fetchVotes = async () => {
    try {
      setLoadingVotes(true);
      const res = await axios.get(`${API_BASE}/votes`);
      setVotes(res.data.votes || []);
    } catch (error) {
      console.error("Fetch votes error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load votes. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoadingVotes(false);
    }
  };

  // Fetch employees for send-invites modal
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await axios.get(`${API_BASE}/employees`);
      setEmployees(res.data.employees || []);
    } catch (error) {
      console.error("Fetch employees error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load employees. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchVotes();
    fetchEmployees();
  }, []);

  const loadingAny = loadingVotes || loadingEmployees;

  const goBackToVotingManagement = () => {
    navigate("/voting");
  };

  const copyVoteLink = (vote) => {
    const url = `${window.location.origin}/vote/${vote._id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          message.success("Vote link copied to clipboard");
        })
        .catch(() => {
          message.error("Failed to copy link");
        });
    } else {
      message.info(`Copy this link: ${url}`);
    }
  };

  // Send invites (same behaviour as VotingManagementPage)
  const handleSendInvites = (vote) => {
    setCurrentVoteForInvites(vote);
    setSendInvitesModalVisible(true);
    setSendModeSelection("all");
    setSelectedInviteEmployeeIds([]);
  };

  const closeSendInvitesModal = () => {
    setSendInvitesModalVisible(false);
    setCurrentVoteForInvites(null);
    setSelectedInviteEmployeeIds([]);
    setSendModeSelection("all");
  };

  // Employees that are voters of the current vote
  const inviteEligibleEmployees = useMemo(() => {
    if (!currentVoteForInvites) return [];
    const voterIds = new Set(
      (currentVoteForInvites.voters || []).map((id) => String(id))
    );
    return employees.filter((emp) =>
      voterIds.has(String(emp._id))
    );
  }, [currentVoteForInvites, employees]);

  const confirmSendInvites = async () => {
    if (!currentVoteForInvites) return;
    const voteId = currentVoteForInvites._id;

    if (
      sendModeSelection === "selected" &&
      selectedInviteEmployeeIds.length === 0
    ) {
      message.warning("Please select at least one employee.");
      return;
    }

    try {
      setSendInvitesModalLoading(true);
      setSendingInviteId(voteId);

      const payload =
        sendModeSelection === "all"
          ? { sendMode: "all" }
          : {
              sendMode: "selected",
              selectedEmployeeIds: selectedInviteEmployeeIds,
            };

      const res = await axios.post(
        `${API_BASE}/votes/${voteId}/send-invites`,
        payload
      );

      const { message: msg, failureCount } = res.data;
      if (failureCount && failureCount > 0) {
        message.warning(
          `${msg || "Invites processed"} (${failureCount} failed)`
        );
      } else {
        message.success(msg || "Invites sent successfully");
      }

      closeSendInvitesModal();
    } catch (error) {
      console.error("Send invites error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send invites. Please try again.";
      message.error(errorMessage);
    } finally {
      setSendInvitesModalLoading(false);
      setSendingInviteId(null);
    }
  };

  const handleDeleteVote = (vote) => {
    confirm({
      title: `Delete vote "${vote.name}"?`,
      icon: <ExclamationCircleOutlined />,
      content:
        "This will permanently delete this vote, all cast votes and invites.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setDeletingVoteId(vote._id);
          const res = await axios.delete(`${API_BASE}/votes/${vote._id}`);
          message.success(res.data.message || "Vote deleted successfully");
          await fetchVotes();
        } catch (error) {
          console.error("Delete vote error:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Failed to delete vote. Please try again.";
          message.error(errorMessage);
        } finally {
          setDeletingVoteId(null);
        }
      },
    });
  };

  const openReportPage = (vote) => {
    navigate(`/voting/${vote._id}/report`);
  };

  // Winner modal helpers
  const openWinnerModal = async (vote) => {
    try {
      setCurrentWinnerVote(vote);
      setWinnerModalVisible(true);
      setWinnerModalLoading(true);

      const res = await axios.get(`${API_BASE}/votes/${vote._id}/winners`);
      setWinnerData(res.data);
    } catch (error) {
      console.error("Fetch winners error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load winners for this vote.";
      message.error(errorMessage);
      setWinnerModalVisible(false);
      setCurrentWinnerVote(null);
      setWinnerData(null);
    } finally {
      setWinnerModalLoading(false);
    }
  };

  const closeWinnerModal = () => {
    setWinnerModalVisible(false);
    setCurrentWinnerVote(null);
    setWinnerData(null);
  };

  const handleMarkWinner = (location, nominee) => {
    if (!winnerData || !winnerData.vote) return;

    if (!winnerData.vote.hasEnded) {
      message.warning(
        "Winner can only be announced after the voting cycle has ended."
      );
      return;
    }

    if (!location.isTie || !nominee.isTop || nominee.locationVotes <= 0) {
      message.warning(
        "Manual winner selection is only allowed for tied top nominees in this store."
      );
      return;
    }

    confirm({
      title: "Confirm winner",
      content: `Announce ${nominee.firstName} ${nominee.lastName} as the official winner for ${location.name} (${location.code})?`,
      okText: "Yes, announce",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.post(
            `${API_BASE}/votes/${winnerData.vote._id}/announce-winner`,
            {
              locationId: location.locationId,
              nomineeId: nominee._id,
            }
          );
          message.success("Winner announced successfully");

          const res = await axios.get(
            `${API_BASE}/votes/${winnerData.vote._id}/winners`
          );
          setWinnerData(res.data);
        } catch (error) {
          console.error("Announce winner error:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Failed to announce winner.";
          message.error(errorMessage);
        }
      },
    });
  };

  const renderWinnerLocationCard = (location) => {
    if (!winnerData || !winnerData.vote) return null;

    const voteHasEnded = winnerData.vote.hasEnded;
    const voteIsActive = winnerData.vote.isActive;

    const {
      name,
      code,
      totalVotes,
      topNominees = [],
      nominees = [],
      officialWinner,
      isTie,
    } = location;

    return (
      <Card
        key={location.locationId}
        type="inner"
        title={`${name} (${code})`}
        style={{ marginBottom: 12 }}
      >
        <Text style={{ display: "block", marginBottom: 8 }}>
          <strong>Total votes in this store:</strong> {totalVotes}
        </Text>

        {officialWinner ? (
          <div style={{ marginBottom: 8 }}>
            <Tag color="green">
              Winner{officialWinner.isAuto ? " (auto)" : ""}
            </Tag>{" "}
            <Text strong>
              {officialWinner.firstName} {officialWinner.lastName}
            </Text>{" "}
            <Text type="secondary">({officialWinner.employeeId})</Text>
            <Text type="secondary" style={{ display: "block" }}>
              Store votes: <strong>{officialWinner.locationVotes}</strong> |
              Points: <strong>{officialWinner.locationPoints}</strong> | Store
              %:{" "}
              <strong>
                {officialWinner.locationPercentage.toFixed(1)}%
              </strong>
            </Text>
          </div>
        ) : topNominees && topNominees.length > 0 ? (
          <div style={{ marginBottom: 8 }}>
            <Tag color="gold">
              {voteHasEnded ? "Top votes (tie)" : "Current leader"}
            </Tag>{" "}
            {topNominees.map((n) => (
              <span key={n._id} style={{ marginRight: 8 }}>
                <Text strong>
                  {n.firstName} {n.lastName}
                </Text>{" "}
                <Text type="secondary">({n.employeeId})</Text>
              </span>
            ))}
          </div>
        ) : (
          <Text type="secondary">
            No votes have been cast in this store yet.
          </Text>
        )}

        {isTie && voteHasEnded && (
          <Text
            type="warning"
            style={{ display: "block", marginBottom: 8 }}
          >
            Tie detected – please mark the official winner from the top nominees
            below.
          </Text>
        )}

        {!voteHasEnded && voteIsActive && (
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 8 }}
          >
            Voting is still active. Showing current leaders based on highest
            votes so far.
          </Text>
        )}

        {nominees && nominees.length > 0 && (
          <>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
              Nominees
            </Text>
            {nominees.map((nominee) => {
              const isOfficial =
                officialWinner &&
                String(officialWinner._id) === String(nominee._id);

              const canMark =
                isTie &&
                voteHasEnded &&
                nominee.isTop &&
                nominee.locationVotes > 0;

              return (
                <div
                  key={nominee._id}
                  style={{
                    padding: "8px 0",
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <Space
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <Space direction="vertical" size={0}>
                        <span>
                          {nominee.isTop && (
                            <Tag color="gold" style={{ marginRight: 4 }}>
                              Top votes
                            </Tag>
                          )}
                          <Text strong>
                            {nominee.firstName} {nominee.lastName}
                          </Text>{" "}
                          <Text type="secondary">
                            ({nominee.employeeId})
                          </Text>
                          {isOfficial && (
                            <Tag
                              color="green"
                              style={{ marginLeft: 4 }}
                            >
                              Official winner
                            </Tag>
                          )}
                        </span>
                        <Text type="secondary">
                          Store votes:{" "}
                          <strong>{nominee.locationVotes}</strong> | Points:{" "}
                          <strong>{nominee.locationPoints}</strong> | Store %:{" "}
                          <strong>
                            {nominee.locationPercentage.toFixed(1)}%
                          </strong>
                        </Text>
                        <Text type="secondary">
                          Total votes (all stores):{" "}
                          <strong>{nominee.totalVotes}</strong> | Total points:{" "}
                          <strong>{nominee.totalPoints}</strong> | Overall %:{" "}
                          <strong>
                            {nominee.overallPercentage.toFixed(1)}%
                          </strong>
                        </Text>
                      </Space>
                    </div>
                    <Button
                      size="small"
                      type={isOfficial ? "primary" : "default"}
                      disabled={!canMark}
                      onClick={() => handleMarkWinner(location, nominee)}
                    >
                      {isOfficial ? "Official winner" : "Mark as winner"}
                    </Button>
                  </Space>
                </div>
              );
            })}
          </>
        )}
      </Card>
    );
  };

  const sortedVotes = useMemo(() => {
    const list = [...votes];
    return list.sort(
      (a, b) =>
        new Date(b.startAt).getTime() -
        new Date(a.startAt).getTime()
    );
  }, [votes]);

  const columns = [
    {
      title: "Vote Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Locations",
      key: "locations",
      render: (_, record) =>
        record.locations && record.locations.length > 0
          ? record.locations.map((loc) => loc.name).join(", ")
          : "-",
    },
    {
      title: "Start",
      dataIndex: "startAt",
      key: "startAt",
      render: (value) => formatDateTimeUK(value),
    },
    {
      title: "End",
      dataIndex: "endAt",
      key: "endAt",
      render: (value) => formatDateTimeUK(value),
    },
    {
      title: "Voters",
      key: "voters",
      render: (_, record) => record.totalVoters || 0,
    },
    {
      title: "Voted",
      key: "voted",
      render: (_, record) => record.totalVotesCast || 0,
    },
    {
      title: "Remaining",
      key: "remaining",
      render: (_, record) => record.remainingVoters || 0,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => renderStatusTag(record),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="default"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyVoteLink(record)}
          >
            Copy Link
          </Button>
          <Button
            type="default"
            size="small"
            icon={<MailOutlined />}
            loading={sendingInviteId === record._id}
            onClick={() => handleSendInvites(record)}
          >
            Send Invites
          </Button>
          <Button
            type="default"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => openReportPage(record)}
          >
            Report
          </Button>
          <Button
            type="default"
            size="small"
            icon={<TrophyOutlined />}
            onClick={() => openWinnerModal(record)}
          >
            Winner
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={deletingVoteId === record._id}
            onClick={() => handleDeleteVote(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        style={{
          width: 1200,
          maxWidth: "100%",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          background:
            "linear-gradient(135deg, #f9fafb 0%, #eff6ff 50%, #ffffff 100%)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        {/* Page navbar/header inside the page */}
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <Title
              level={3}
              style={{ marginBottom: 4, color: "#0f172a" }}
            >
              All Votes
            </Title>
            <Text type="secondary">
              Showing all votes (past, active and upcoming) sorted by start date.
            </Text>
          </div>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={goBackToVotingManagement}
          >
            Back to Voting Management
          </Button>
        </div>

        <Card
          type="inner"
          title="All Votes History"
          style={{
            borderRadius: 12,
          }}
          bodyStyle={{ padding: 16 }}
        >
          {sortedVotes.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
              }}
            >
              <Text type="secondary">
                No votes found. Once votes are created, they will appear here.
              </Text>
            </div>
          ) : (
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={sortedVotes}
              loading={loadingAny}
              pagination={false}
              size="middle"
            />
          )}
        </Card>
      </Card>

      {/* Send Invites Modal */}
      <Modal
        title={
          currentVoteForInvites
            ? `Send Email - ${currentVoteForInvites.name}`
            : "Send Email"
        }
        open={sendInvitesModalVisible}
        onCancel={closeSendInvitesModal}
        onOk={confirmSendInvites}
        confirmLoading={sendInvitesModalLoading}
        okText="Send"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Radio.Group
            value={sendModeSelection}
            onChange={(e) => setSendModeSelection(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="all">Send to all voters of this vote</Radio>
              <Radio value="selected">Send only to selected employees</Radio>
            </Space>
          </Radio.Group>

          {sendModeSelection === "selected" && (
            <Table
              style={{ display: "none" }}
            />
          )}

          {sendModeSelection === "selected" && (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text type="secondary">Select employees to send email</Text>
              <select
                multiple
                style={{
                  width: "100%",
                  minHeight: 120,
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #d9d9d9",
                }}
                value={selectedInviteEmployeeIds}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions);
                  setSelectedInviteEmployeeIds(
                    options.map((opt) => opt.value)
                  );
                }}
              >
                {inviteEligibleEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </Space>
          )}
        </Space>
      </Modal>

      {/* Winner Modal */}
      <Modal
        title={
          currentWinnerVote ? `Winner - ${currentWinnerVote.name}` : "Winner"
        }
        open={winnerModalVisible}
        onCancel={closeWinnerModal}
        footer={null}
        width={800}
      >
        {winnerModalLoading ? (
          <Text>Loading winner...</Text>
        ) : !winnerData ? (
          <Text type="secondary">
            No winner data available for this vote yet.
          </Text>
        ) : (
          <>
            <Space
              direction="vertical"
              size={4}
              style={{ marginBottom: 16 }}
            >
              <Text>
                <strong>Vote:</strong> {winnerData.vote.name}
              </Text>
              <Text>
                <strong>Voting window:</strong>{" "}
                {formatDateTimeUK(winnerData.vote.startAt)} —{" "}
                {formatDateTimeUK(winnerData.vote.endAt)}
              </Text>
              <Text>
                <strong>Status:</strong>{" "}
                {winnerData.vote.isActive
                  ? "Active"
                  : winnerData.vote.hasEnded
                  ? "Ended"
                  : "Upcoming"}
              </Text>
            </Space>

            {winnerData.locations && winnerData.locations.length > 0 ? (
              winnerData.locations.map((loc) =>
                renderWinnerLocationCard(loc)
              )
            ) : (
              <Text type="secondary">
                No locations configured for this vote.
              </Text>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default AllVotesPage;
