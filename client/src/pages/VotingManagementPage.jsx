import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  message,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Switch,
  Radio,
  Pagination,
  Dropdown,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Badge,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CopyOutlined,
  BarChartOutlined,
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  TrophyOutlined,
  FilterOutlined,
  MoreOutlined,
  LoadingOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const VotingManagementPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [votes, setVotes] = useState([]);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingVotes, setLoadingVotes] = useState(false);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [editingVote, setEditingVote] = useState(null);

  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [sendingInviteId, setSendingInviteId] = useState(null);
  const [deletingVoteId, setDeletingVoteId] = useState(null);

  // 🔹 Filters
  const [selectedStoreId, setSelectedStoreId] = useState("all"); // store filter (internal "all" state)
  const [showCurrentOnly, setShowCurrentOnly] = useState(true); // "Current active" filter

  // 🔹 Pagination state (front-end only)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 🔹 Winner modal state
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);
  const [winnerModalLoading, setWinnerModalLoading] = useState(false);
  const [currentWinnerVote, setCurrentWinnerVote] = useState(null);
  const [winnerData, setWinnerData] = useState(null);

  // ✅ NEW: global notify loading state (one button for the whole vote)
  const [notifyingResults, setNotifyingResults] = useState(false);

  // 🔹 Send-invites modal state
  const [sendInvitesModalVisible, setSendInvitesModalVisible] = useState(false);
  const [sendInvitesModalLoading, setSendInvitesModalLoading] = useState(false);
  const [currentVoteForInvites, setCurrentVoteForInvites] = useState(null);
  const [sendModeSelection, setSendModeSelection] = useState("all"); // "all" | "selected" | "notifyWinners"
  const [selectedInviteEmployeeIds, setSelectedInviteEmployeeIds] = useState([]);

  const API_BASE = API_BASE_URL;

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const res = await axios.get(`${API_BASE}/locations`);
      setLocations(res.data.locations || []);
    } catch (error) {
      console.error("Fetch locations error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load locations. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoadingLocations(false);
    }
  };

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

  const fetchVotes = async () => {
    try {
      setLoadingVotes(true);
      const res = await axios.get(`${API_BASE}/votes`);
      setVotes(res.data.votes || []);
    } catch (error) {
      console.error("Fetch votes error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load votes. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoadingVotes(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchEmployees();
    fetchVotes();
  }, []);

  const loadingAny = loadingLocations || loadingEmployees || loadingVotes;

  const goBack = () => {
    navigate("/dashboard");
  };

  const goToAllVotes = () => {
    navigate("/voting/all-votes");
  };

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
      borderRadius: 999,
      padding: "2px 10px",
      fontSize: 12,
      lineHeight: "18px",
      fontWeight: 600,
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

  const handleLocationsChange = (value) => {
    setSelectedLocationIds(value);

    // When locations change, clear voters + nominees selections
    form.setFieldsValue({
      voterIds: [],
      nomineeIds: [],
    });

    const filtered = employees.filter((emp) => {
      if (!emp.locations || emp.locations.length === 0) return false;
      return emp.locations.some((loc) => value.includes(String(loc._id)));
    });

    setFilteredEmployees(filtered);
  };

  const handleSelectAllVoters = () => {
    const allIds = filteredEmployees.map((emp) => String(emp._id));
    form.setFieldsValue({
      voterIds: allIds,
    });
    message.success("All filtered employees selected as voters");
  };

  const openCreateModal = () => {
    setFormMode("create");
    setEditingVote(null);
    setSelectedLocationIds([]);
    setFilteredEmployees([]);
    form.resetFields();
    setFormModalVisible(true);
  };

  const openEditModal = (vote) => {
    const locationIds = (vote.locations || []).map((loc) => String(loc._id || loc));

    setFormMode("edit");
    setEditingVote(vote);
    setSelectedLocationIds(locationIds);

    const filtered = employees.filter((emp) => {
      if (!emp.locations || emp.locations.length === 0) return false;
      return emp.locations.some((loc) => locationIds.includes(String(loc._id)));
    });

    setFilteredEmployees(filtered);

    form.setFieldsValue({
      name: vote.name,
      locationIds,
      startAt: vote.startAt ? dayjs(vote.startAt) : null,
      endAt: vote.endAt ? dayjs(vote.endAt) : null,
      voterIds: (vote.voters || []).map((id) => String(id)),
      nomineeIds: (vote.nominees || []).map((id) => String(id)),
      votePoints: vote.votePoints,
      maxVotesPerVoter: vote.maxVotesPerVoter,
    });

    setFormModalVisible(true);
  };

  const closeFormModal = () => {
    setFormModalVisible(false);
    setEditingVote(null);
    setFormMode("create");
    form.resetFields();
    setSelectedLocationIds([]);
    setFilteredEmployees([]);
  };

  const buildPayloadFromForm = (values) => {
    return {
      name: values.name,
      locationIds: values.locationIds,
      startAt: values.startAt ? values.startAt.toISOString() : null,
      endAt: values.endAt ? values.endAt.toISOString() : null,
      voterIds: values.voterIds,
      nomineeIds: values.nomineeIds,
      votePoints: values.votePoints,
      maxVotesPerVoter: values.maxVotesPerVoter,
    };
  };

  const handleSubmitVote = async (values) => {
    try {
      setFormSubmitting(true);
      const payload = buildPayloadFromForm(values);

      if (formMode === "edit" && editingVote) {
        const res = await axios.put(`${API_BASE}/votes/${editingVote._id}`, payload);
        message.success(res.data.message || "Vote updated successfully");
      } else {
        const res = await axios.post(`${API_BASE}/votes`, payload);
        message.success(res.data.message || "Vote created successfully");
      }

      closeFormModal();
      await fetchVotes();
    } catch (error) {
      console.error("Save vote error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save vote. Please try again.";
      message.error(errorMessage);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteVote = (vote) => {
    confirm({
      title: `Delete vote "${vote.name}"?`,
      icon: <ExclamationCircleOutlined />,
      content: "This will permanently delete this vote, all cast votes and invites.",
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
            error.response?.data?.message || "Failed to delete vote. Please try again.";
          message.error(errorMessage);
        } finally {
          setDeletingVoteId(null);
        }
      },
    });
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

  // 🔹 Open send-invites modal
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
    const voterIds = new Set((currentVoteForInvites.voters || []).map((id) => String(id)));
    return employees.filter((emp) => voterIds.has(String(emp._id)));
  }, [currentVoteForInvites, employees]);

  // 🔹 Actually send invites / notify results (respecting mode)
  const confirmSendInvites = async () => {
    if (!currentVoteForInvites) return;
    const voteId = currentVoteForInvites._id;

    if (sendModeSelection === "selected" && selectedInviteEmployeeIds.length === 0) {
      message.warning("Please select at least one employee.");
      return;
    }

    try {
      setSendInvitesModalLoading(true);
      setSendingInviteId(voteId);

      let res;

      if (sendModeSelection === "notifyWinners") {
        // Your backend now notifies ALL employees of this vote cycle (global).
        res = await axios.post(`${API_BASE}/votes/${voteId}/notify-nominees-winners`);
      } else {
        const payload =
          sendModeSelection === "all"
            ? { sendMode: "all" }
            : {
                sendMode: "selected",
                selectedEmployeeIds: selectedInviteEmployeeIds,
              };

        res = await axios.post(`${API_BASE}/votes/${voteId}/send-invites`, payload);
      }

      const { message: msg, failureCount } = res.data || {};

      if (failureCount && failureCount > 0) {
        message.warning(`${msg || "Emails processed"} (${failureCount} failed)`);
      } else {
        message.success(
          msg ||
            (sendModeSelection === "notifyWinners"
              ? "Results notified successfully"
              : "Invites sent successfully")
        );
      }

      closeSendInvitesModal();

      // Refresh votes list so UI reflects notified status if your /votes returns it
      await fetchVotes();
    } catch (error) {
      console.error("Send invites / notify winners error:", error);
      const errorMessage =
        error.response?.data?.message ||
        (sendModeSelection === "notifyWinners"
          ? "Failed to notify results. Please try again."
          : "Failed to send invites. Please try again.");
      message.error(errorMessage);
    } finally {
      setSendInvitesModalLoading(false);
      setSendingInviteId(null);
    }
  };

  const openReportPage = (vote) => {
    navigate(`/voting/${vote._id}/report`);
  };

  // 🔹 Winner modal helpers
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
        error.response?.data?.message || "Failed to load winners for this vote.";
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
    setNotifyingResults(false);
  };

  // ✅ helper: detect “already notified” flag safely (supports different backend field names)
  const isResultsNotified = (vote) => {
    if (!vote) return false;
    return Boolean(
      vote.resultsNotified ||
        vote.isResultsNotified ||
        vote.resultsNotificationSent ||
        vote.notifiedResults ||
        vote.hasNotifiedResults
    );
  };

  // ✅ Global notify (ONE time) for the whole vote
  const notifyWholeVote = async () => {
    if (!winnerData || !winnerData.vote) return;

    if (!winnerData.vote.hasEnded) {
      message.warning("You can notify results only after the voting cycle has ended.");
      return;
    }

    if (isResultsNotified(winnerData.vote)) {
      message.warning("Results already notified for this vote.");
      return;
    }

    confirm({
      title: "Announce results to all employees?",
      icon: <ExclamationCircleOutlined />,
      content:
        "This will notify ALL employees of this voting cycle. You can only send this once.",
      okText: "Announce",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setNotifyingResults(true);

          // ✅ Use your existing endpoint (backend updated to notify all employees)
          const res = await axios.post(
            `${API_BASE}/votes/${winnerData.vote._id}/notify-nominees-winners`
          );

          message.success(res.data?.message || "Results announced successfully");

          // Reload winner data so the button disables based on backend flag
          const refreshed = await axios.get(
            `${API_BASE}/votes/${winnerData.vote._id}/winners`
          );
          setWinnerData(refreshed.data);

          // Also refresh vote list for management page view
          await fetchVotes();
        } catch (error) {
          console.error("Global notify error:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Failed to announce results. Please try again.";
          message.error(errorMessage);
        } finally {
          setNotifyingResults(false);
        }
      },
    });
  };

  const handleMarkWinner = (location, nominee) => {
    if (!winnerData || !winnerData.vote) return;

    if (!winnerData.vote.hasEnded) {
      message.warning("Winner can only be announced after the voting cycle has ended.");
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
          await axios.post(`${API_BASE}/votes/${winnerData.vote._id}/announce-winner`, {
            locationId: location.locationId,
            nomineeId: nominee._id,
          });
          message.success("Winner announced successfully");

          const res = await axios.get(`${API_BASE}/votes/${winnerData.vote._id}/winners`);
          setWinnerData(res.data);
        } catch (error) {
          console.error("Announce winner error:", error);
          const errorMessage =
            error.response?.data?.message || "Failed to announce winner.";
          message.error(errorMessage);
        }
      },
    });
  };

  const renderWinnerLocationCard = (location) => {
    if (!winnerData || !winnerData.vote) return null;

    const voteHasEnded = winnerData.vote.hasEnded;
    const voteIsActive = winnerData.vote.isActive;

    const { name, code, totalVotes, topNominees = [], nominees = [], officialWinner, isTie } =
      location;

    return (
      <Card
        key={location.locationId}
        type="inner"
        style={{
          marginBottom: 14,
          borderRadius: 14,
          border: "1px solid #eef2ff",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
        }}
        title={
          <Space size={10}>
            <ShopOutlined style={{ color: "#1d4ed8" }} />
            <span style={{ fontWeight: 700 }}>{`${name} (${code})`}</span>
            <Tag style={{ borderRadius: 999 }} color="blue">
              {totalVotes} votes
            </Tag>
          </Space>
        }
      >
        {/* Winner / current leader */}
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#f8fafc",
            border: "1px solid #eef2f7",
            marginBottom: 12,
          }}
        >
          {officialWinner ? (
            <>
              <Space wrap>
                <Tag color="green" style={{ borderRadius: 999, fontWeight: 600 }}>
                  Winner{officialWinner.isAuto ? " (auto)" : ""}
                </Tag>
                <Text strong style={{ fontSize: 14 }}>
                  {officialWinner.firstName} {officialWinner.lastName}
                </Text>
                <Text type="secondary">({officialWinner.employeeId})</Text>
              </Space>

              <div style={{ marginTop: 8 }}>
                <Space wrap size="large">
                  <Text type="secondary">
                    Store votes: <strong>{officialWinner.locationVotes}</strong>
                  </Text>
                  <Text type="secondary">
                    Points: <strong>{officialWinner.locationPoints}</strong>
                  </Text>
                  <Text type="secondary">
                    Store %: <strong>{officialWinner.locationPercentage.toFixed(1)}%</strong>
                  </Text>
                </Space>
              </div>
            </>
          ) : topNominees && topNominees.length > 0 ? (
            <>
              <Space wrap>
                <Tag color="gold" style={{ borderRadius: 999, fontWeight: 600 }}>
                  {voteHasEnded ? "Top votes (tie)" : "Current leader"}
                </Tag>
                {topNominees.map((n) => (
                  <span key={n._id} style={{ marginRight: 8 }}>
                    <Text strong>
                      {n.firstName} {n.lastName}
                    </Text>{" "}
                    <Text type="secondary">({n.employeeId})</Text>
                  </span>
                ))}
              </Space>
            </>
          ) : (
            <Text type="secondary">No votes have been cast in this store yet.</Text>
          )}

          {isTie && voteHasEnded && (
            <Text type="warning" style={{ display: "block", marginTop: 10 }}>
              Tie detected – please mark the official winner from the top nominees below.
            </Text>
          )}

          {!voteHasEnded && voteIsActive && (
            <Text type="secondary" style={{ display: "block", marginTop: 10 }}>
              Voting is still active. Showing current leaders based on highest votes so far.
            </Text>
          )}
        </div>

        {/* Nominees list */}
        {nominees && nominees.length > 0 && (
          <>
            <Divider style={{ margin: "8px 0 12px" }} />
            <Text strong style={{ display: "block", marginBottom: 10 }}>
              Nominees
            </Text>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nominees.map((nominee) => {
                const isOfficial =
                  officialWinner && String(officialWinner._id) === String(nominee._id);

                const canMark =
                  isTie && voteHasEnded && nominee.isTop && nominee.locationVotes > 0;

                return (
                  <div
                    key={nominee._id}
                    style={{
                      border: "1px solid #eef2f7",
                      borderRadius: 12,
                      padding: 12,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 240, flex: 1 }}>
                        <Space wrap size={8}>
                          {nominee.isTop && (
                            <Tag color="gold" style={{ borderRadius: 999, fontWeight: 600 }}>
                              Top votes
                            </Tag>
                          )}
                          <Text strong style={{ fontSize: 14 }}>
                            {nominee.firstName} {nominee.lastName}
                          </Text>
                          <Text type="secondary">({nominee.employeeId})</Text>
                          {isOfficial && (
                            <Tag color="green" style={{ borderRadius: 999, fontWeight: 600 }}>
                              Official winner
                            </Tag>
                          )}
                        </Space>

                        <div style={{ marginTop: 8 }}>
                          <Space wrap size="large">
                            <Text type="secondary">
                              Store votes: <strong>{nominee.locationVotes}</strong>
                            </Text>
                            <Text type="secondary">
                              Points: <strong>{nominee.locationPoints}</strong>
                            </Text>
                            <Text type="secondary">
                              Store %:{" "}
                              <strong>{nominee.locationPercentage.toFixed(1)}%</strong>
                            </Text>
                          </Space>
                        </div>

                        <div style={{ marginTop: 4 }}>
                          <Space wrap size="large">
                            <Text type="secondary">
                              Total votes: <strong>{nominee.totalVotes}</strong>
                            </Text>
                            <Text type="secondary">
                              Total points: <strong>{nominee.totalPoints}</strong>
                            </Text>
                            <Text type="secondary">
                              Overall %:{" "}
                              <strong>{nominee.overallPercentage.toFixed(1)}%</strong>
                            </Text>
                          </Space>
                        </div>
                      </div>

                      <div>
                        <Button
                          size="small"
                          type={isOfficial ? "primary" : "default"}
                          disabled={!canMark}
                          onClick={() => handleMarkWinner(location, nominee)}
                        >
                          {isOfficial ? "Official winner" : "Mark as winner"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    );
  };

  // 🔹 Winner History page navigation
  const goToWinners = () => {
    navigate("/winners/history");
  };

  const columns = [
    {
      title: "Vote Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (value) => (
        <Tooltip title={value}>
          <Text strong style={{ color: "#0f172a" }}>
            {value}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Locations",
      key: "locations",
      ellipsis: true,
      render: (_, record) =>
        record.locations && record.locations.length > 0
          ? record.locations.map((loc) => loc.name).join(", ")
          : "-",
    },
    {
      title: "Start",
      dataIndex: "startAt",
      key: "startAt",
      render: (value) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: "#64748b" }} />
          <span>{formatDateTimeUK(value)}</span>
        </Space>
      ),
    },
    {
      title: "End",
      dataIndex: "endAt",
      key: "endAt",
      render: (value) => (
        <Space size={6}>
          <ClockCircleOutlined style={{ color: "#64748b" }} />
          <span>{formatDateTimeUK(value)}</span>
        </Space>
      ),
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
      width: 80,
      render: (_, record) => {
        const handleMenuClick = ({ key }) => {
          switch (key) {
            case "copy":
              copyVoteLink(record);
              break;
            case "sendInvites":
              handleSendInvites(record);
              break;
            case "report":
              openReportPage(record);
              break;
            case "winner":
              openWinnerModal(record);
              break;
            case "edit":
              openEditModal(record);
              break;
            case "delete":
              handleDeleteVote(record);
              break;
            default:
              break;
          }
        };

        const items = [
          {
            key: "copy",
            label: (
              <span>
                <CopyOutlined style={{ marginRight: 8 }} />
                Copy Link
              </span>
            ),
          },
          {
            key: "sendInvites",
            label: (
              <span>
                {sendingInviteId === record._id ? (
                  <LoadingOutlined style={{ marginRight: 8 }} />
                ) : (
                  <MailOutlined style={{ marginRight: 8 }} />
                )}
                {sendingInviteId === record._id ? "Sending..." : "Send Invites"}
              </span>
            ),
            disabled: sendingInviteId === record._id,
          },
          {
            key: "report",
            label: (
              <span>
                <BarChartOutlined style={{ marginRight: 8 }} />
                Report
              </span>
            ),
          },
          {
            key: "winner",
            label: (
              <span>
                <TrophyOutlined style={{ marginRight: 8 }} />
                Winner
              </span>
            ),
          },
          {
            key: "edit",
            label: (
              <span>
                <EditOutlined style={{ marginRight: 8 }} />
                Edit
              </span>
            ),
          },
          {
            key: "delete",
            danger: true,
            label: (
              <span>
                {deletingVoteId === record._id ? (
                  <LoadingOutlined style={{ marginRight: 8 }} />
                ) : (
                  <DeleteOutlined style={{ marginRight: 8 }} />
                )}
                {deletingVoteId === record._id ? "Deleting..." : "Delete"}
              </span>
            ),
            disabled: deletingVoteId === record._id,
          },
        ];

        return (
          <Dropdown trigger={["click"]} menu={{ items, onClick: handleMenuClick }}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // 🔹 Base filtered votes according to store + "current active"
  const filteredVotesBase = useMemo(() => {
    let list = [...votes];

    if (selectedStoreId !== "all") {
      list = list.filter((vote) =>
        (vote.locations || []).some((loc) => String(loc._id) === selectedStoreId)
      );
    }

    if (showCurrentOnly) {
      list = list.filter((vote) => vote.isActive);
    }

    return list;
  }, [votes, selectedStoreId, showCurrentOnly]);

  const totalFilteredVotes = filteredVotesBase.length;

  const totalActiveVotes = useMemo(() => votes.filter((v) => v.isActive).length, [votes]);
  const totalEndedVotes = useMemo(() => votes.filter((v) => v.hasEnded).length, [votes]);

  const paginatedVotes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredVotesBase.slice(startIndex, endIndex);
  }, [filteredVotesBase, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStoreId, showCurrentOnly]);

  const groupedVotes = useMemo(() => {
    if (!paginatedVotes || paginatedVotes.length === 0) return [];

    const map = new Map();

    paginatedVotes.forEach((vote) => {
      const locs = Array.isArray(vote.locations) ? vote.locations : [];
      if (locs.length === 0) {
        if (!map.has("no-location")) {
          map.set("no-location", {
            location: null,
            votes: [],
          });
        }
        map.get("no-location").votes.push(vote);
      } else {
        locs.forEach((loc) => {
          if (!loc || !loc._id) return;
          const locId = String(loc._id);
          if (!map.has(locId)) {
            map.set(locId, {
              location: loc,
              votes: [],
            });
          }
          map.get(locId).votes.push(vote);
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const nameA = a.location ? a.location.name || "" : "";
      const nameB = b.location ? b.location.name || "" : "";
      return nameA.localeCompare(nameB);
    });
  }, [paginatedVotes]);

  return (
    <>
      <Card
        style={{
          width: 1200,
          maxWidth: "100%",
          borderRadius: 18,
          border: "1px solid #eef2f7",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
          background:
            "radial-gradient(1200px 400px at 10% 0%, rgba(59,130,246,0.12) 0%, rgba(255,255,255,0) 55%), radial-gradient(900px 360px at 90% 0%, rgba(99,102,241,0.10) 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #ffffff 100%)",
        }}
        bodyStyle={{ padding: 22 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ minWidth: 260 }}>
            <Title level={3} style={{ marginBottom: 4, color: "#0f172a" }}>
              Voting Management
            </Title>
            <Text type="secondary">
              Create, edit and monitor voting sessions for each store.
            </Text>
          </div>

          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Create Vote
            </Button>
            <Button icon={<TrophyOutlined />} onClick={goToWinners}>
              Winner History
            </Button>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={goBack}>
              Back to Dashboard
            </Button>
          </Space>
        </div>

        {/* Stats */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: 14,
                border: "1px solid #eef2f7",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Statistic
                title={<Text type="secondary">Total Votes</Text>}
                value={votes.length}
                prefix={<TeamOutlined style={{ color: "#1d4ed8" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: 14,
                border: "1px solid #eef2f7",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Statistic
                title={<Text type="secondary">Active</Text>}
                value={totalActiveVotes}
                prefix={<CheckCircleOutlined style={{ color: "#16a34a" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: 14,
                border: "1px solid #eef2f7",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Statistic
                title={<Text type="secondary">Ended</Text>}
                value={totalEndedVotes}
                prefix={<ClockCircleOutlined style={{ color: "#ef4444" }} />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{
                borderRadius: 14,
                border: "1px solid #eef2f7",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Statistic
                title={<Text type="secondary">Stores</Text>}
                value={locations.length}
                prefix={<ShopOutlined style={{ color: "#7c3aed" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* List / Filters */}
        <Card
          type="inner"
          style={{
            borderRadius: 16,
            border: "1px solid #eef2f7",
            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.06)",
          }}
          bodyStyle={{ padding: 16 }}
          title={
            <Space size={10}>
              <Badge color="#2563eb" />
              <span style={{ fontWeight: 800, color: "#0f172a" }}>Existing Votes</span>
            </Space>
          }
          extra={
            <Button size="small" type="default" onClick={goToAllVotes}>
              Show all votes
            </Button>
          }
        >
          {/* Filter Bar */}
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "rgba(241,245,249,0.8)",
              border: "1px solid #e2e8f0",
              marginBottom: 14,
            }}
          >
            <Row gutter={[10, 10]} align="middle">
              <Col xs={24} md={12} lg={9}>
                <Space size={8} style={{ width: "100%" }}>
                  <FilterOutlined style={{ color: "#64748b" }} />
                  <Select
                    size="middle"
                    style={{ width: "100%" }}
                    value={selectedStoreId === "all" ? undefined : selectedStoreId}
                    onChange={(value) => setSelectedStoreId(value || "all")}
                    placeholder="Filter by store"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                  >
                    {locations.map((loc) => (
                      <Option key={loc._id} value={String(loc._id)}>
                        {loc.name} ({loc.code})
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>

              <Col xs={24} md={12} lg={9}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    justifyContent: "space-between",
                    padding: "0 6px",
                  }}
                >
                  <Space size={8}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Current Active Only
                    </Text>
                    <Switch
                      checked={showCurrentOnly}
                      onChange={(checked) => setShowCurrentOnly(checked)}
                    />
                  </Space>

                  <Tag style={{ borderRadius: 999, margin: 0 }} color="blue">
                    Showing {totalFilteredVotes} vote{totalFilteredVotes !== 1 ? "s" : ""}
                  </Tag>
                </div>
              </Col>

              <Col xs={24} lg={6} style={{ display: "flex", justifyContent: "flex-end" }}>
                <Space wrap>
                  <Button size="middle" icon={<TrophyOutlined />} onClick={goToWinners}>
                    Winner History
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {groupedVotes.length === 0 ? (
            <div style={{ padding: 26 }}>
              <Empty
                description={
                  <Text type="secondary">
                    No votes found. Click <strong>Create Vote</strong> to start a new voting
                    session.
                  </Text>
                }
              />
            </div>
          ) : (
            <>
              {groupedVotes.map((group) => (
                <Card
                  key={group.location ? group.location._id : "no-location"}
                  type="inner"
                  style={{
                    marginBottom: 14,
                    borderRadius: 16,
                    border: "1px solid #eef2f7",
                    boxShadow: "0 10px 22px rgba(15, 23, 42, 0.06)",
                    background: "#ffffff",
                  }}
                  title={
                    <Space size="middle" style={{ alignItems: "center" }}>
                      <ShopOutlined style={{ color: "#2563eb" }} />
                      <span style={{ fontWeight: 800, color: "#0f172a" }}>
                        {group.location
                          ? `${group.location.name} (${group.location.code})`
                          : "No Location Assigned"}
                      </span>
                      <Tag color="blue" style={{ borderRadius: 999, fontWeight: 600 }}>
                        {group.votes.length} vote{group.votes.length !== 1 ? "s" : ""}
                      </Tag>
                    </Space>
                  }
                >
                  <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={group.votes}
                    loading={loadingAny}
                    pagination={false}
                    size="middle"
                    bordered={false}
                    rowClassName={() => "vote-row"}
                    style={{ borderRadius: 12, overflow: "hidden" }}
                  />
                </Card>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalFilteredVotes}
                  showSizeChanger
                  pageSizeOptions={["5", "10", "20", "50"]}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} votes`}
                  size="small"
                />
              </div>
            </>
          )}
        </Card>
      </Card>

      {/* Create / Edit Vote Modal */}
      <Modal
        title={formMode === "edit" ? "Edit Vote" : "Create Vote"}
        open={formModalVisible}
        onCancel={closeFormModal}
        onOk={() => form.submit()}
        confirmLoading={formSubmitting}
        okText={formMode === "edit" ? "Update" : "Create"}
        width={720}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmitVote}>
          <Row gutter={[12, 0]}>
            <Col xs={24}>
              <Form.Item
                label="Vote Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter vote name" },
                  { min: 3, message: "Vote name must be at least 3 characters" },
                ]}
              >
                <Input placeholder="e.g. Employee of the Month" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Voting Locations"
                name="locationIds"
                rules={[{ required: true, message: "Please select at least one location" }]}
              >
                <Select
                  mode="multiple"
                  placeholder={loadingLocations ? "Loading locations..." : "Select one or more locations"}
                  onChange={handleLocationsChange}
                  disabled={loadingLocations}
                  showSearch
                  optionFilterProp="children"
                >
                  {locations.map((loc) => (
                    <Option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Start Date & Time"
                name="startAt"
                rules={[{ required: true, message: "Please select start date and time" }]}
              >
                <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="End Date & Time"
                name="endAt"
                rules={[{ required: true, message: "Please select end date and time" }]}
              >
                <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label={
                  <Space size={8}>
                    <span>Voters</span>
                    <Tag style={{ borderRadius: 999, margin: 0 }} color="blue">
                      {filteredEmployees.length} available
                    </Tag>
                  </Space>
                }
                name="voterIds"
                rules={[{ required: true, message: "Please select at least one voter" }]}
              >
                <Select
                  mode="multiple"
                  placeholder={selectedLocationIds.length === 0 ? "Select locations first" : "Select voters"}
                  disabled={loadingEmployees || loadingLocations || selectedLocationIds.length === 0}
                  showSearch
                  optionFilterProp="children"
                >
                  {filteredEmployees.map((emp) => (
                    <Option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Button
                type="link"
                style={{ paddingLeft: 0, marginTop: -6, marginBottom: 10 }}
                onClick={handleSelectAllVoters}
                disabled={filteredEmployees.length === 0}
              >
                Select all filtered employees as voters
              </Button>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Nominees"
                name="nomineeIds"
                rules={[{ required: true, message: "Please select at least one nominee" }]}
              >
                <Select
                  mode="multiple"
                  placeholder={selectedLocationIds.length === 0 ? "Select locations first" : "Select nominees"}
                  disabled={loadingEmployees || loadingLocations || selectedLocationIds.length === 0}
                  showSearch
                  optionFilterProp="children"
                >
                  {filteredEmployees.map((emp) => (
                    <Option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Vote Points (weight per vote)"
                name="votePoints"
                rules={[{ required: true, message: "Please enter vote points" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Max Votes Per Voter"
                name="maxVotesPerVoter"
                rules={[
                  {
                    required: true,
                    message: "Please enter how many nominees a single voter can select",
                  },
                ]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Send Invites Modal */}
      <Modal
        title={currentVoteForInvites ? `Send Email - ${currentVoteForInvites.name}` : "Send Email"}
        open={sendInvitesModalVisible}
        onCancel={closeSendInvitesModal}
        onOk={confirmSendInvites}
        confirmLoading={sendInvitesModalLoading}
        okText="Send"
        width={640}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div
            style={{
              padding: 12,
              borderRadius: 14,
              background: "#f8fafc",
              border: "1px solid #eef2f7",
            }}
          >
            <Radio.Group value={sendModeSelection} onChange={(e) => setSendModeSelection(e.target.value)}>
              <Space direction="vertical">
                <Radio value="all">Send to all voters of this vote</Radio>
                <Radio value="selected">Send only to selected employees</Radio>
                <Radio value="notifyWinners" disabled={!currentVoteForInvites || !currentVoteForInvites.hasEnded}>
                  Notify all employees of this voting cycle (results)
                  {currentVoteForInvites && !currentVoteForInvites.hasEnded && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "#888" }}>
                      (available after voting ends)
                    </span>
                  )}
                </Radio>
              </Space>
            </Radio.Group>
          </div>

          {sendModeSelection === "selected" && (
            <div>
              <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                Select employees to send email
              </Text>

              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Select employees"
                value={selectedInviteEmployeeIds}
                onChange={(vals) => setSelectedInviteEmployeeIds(vals)}
                showSearch
                optionFilterProp="children"
              >
                {inviteEligibleEmployees.map((emp) => (
                  <Option key={emp._id} value={String(emp._id)}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </Option>
                ))}
              </Select>

              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                Tip: You can search by name or employee ID.
              </Text>
            </div>
          )}
        </Space>
      </Modal>

      {/* Winner Modal */}
      <Modal
        title={currentWinnerVote ? `Winner - ${currentWinnerVote.name}` : "Winner"}
        open={winnerModalVisible}
        onCancel={closeWinnerModal}
        footer={null}
        width={860}
      >
        {winnerModalLoading ? (
          <div style={{ padding: 18 }}>
            <Text>Loading winner...</Text>
          </div>
        ) : !winnerData ? (
          <div style={{ padding: 18 }}>
            <Text type="secondary">No winner data available for this vote yet.</Text>
          </div>
        ) : (
          <>
            <Card
              size="small"
              style={{
                borderRadius: 16,
                border: "1px solid #eef2f7",
                background: "#f8fafc",
                marginBottom: 14,
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Row gutter={[12, 8]} align="middle">
                <Col xs={24} md={10}>
                  <Text type="secondary">Vote</Text>
                  <div>
                    <Text strong style={{ fontSize: 14 }}>
                      {winnerData.vote.name}
                    </Text>
                  </div>
                </Col>

                <Col xs={24} md={10}>
                  <Text type="secondary">Voting window</Text>
                  <div>
                    <Text>
                      {formatDateTimeUK(winnerData.vote.startAt)} — {formatDateTimeUK(winnerData.vote.endAt)}
                    </Text>
                  </div>
                </Col>

                <Col xs={24} md={4} style={{ display: "flex", justifyContent: "flex-end" }}>
                  {/* ✅ ONE GLOBAL ANNOUNCE BUTTON (ONE TIME) */}
                  <Tooltip
                    title={
                      !winnerData.vote.hasEnded
                        ? "Available after voting ends"
                        : isResultsNotified(winnerData.vote)
                        ? "Results already notified"
                        : "Announce results to all employees"
                    }
                  >
                    <Button
                      size="small"
                      type="primary"
                      icon={notifyingResults ? <LoadingOutlined /> : <MailOutlined />}
                      onClick={notifyWholeVote}
                      loading={notifyingResults}
                      disabled={!winnerData.vote.hasEnded || isResultsNotified(winnerData.vote)}
                    >
                      Announce
                    </Button>
                  </Tooltip>
                </Col>
              </Row>

              <div style={{ marginTop: 10 }}>
                <Tag style={{ borderRadius: 999, fontWeight: 600 }}>
                  {winnerData.vote.isActive ? "Active" : winnerData.vote.hasEnded ? "Ended" : "Upcoming"}
                </Tag>
              </div>
            </Card>

            {winnerData.locations && winnerData.locations.length > 0 ? (
              winnerData.locations.map((loc) => renderWinnerLocationCard(loc))
            ) : (
              <Text type="secondary">No locations configured for this vote.</Text>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default VotingManagementPage;
