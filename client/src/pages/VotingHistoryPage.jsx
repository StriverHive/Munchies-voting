// client/src/pages/VotingHistoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  Space,
  Tag,
  Modal,
  message,
  Empty,
  Skeleton,
  Divider,
  Row,
  Col,
  Statistic,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  CopyOutlined,
  BarChartOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { confirm } = Modal;

const VotingHistoryPage = () => {
  const navigate = useNavigate();

  const [votes, setVotes] = useState([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

  // Winner modal state (same behaviour as Voting Management)
  const [winnerModalVisible, setWinnerModalVisible] = useState(false);
  const [winnerModalLoading, setWinnerModalLoading] = useState(false);
  const [currentWinnerVote, setCurrentWinnerVote] = useState(null);
  const [winnerData, setWinnerData] = useState(null);

  const API_BASE = "http://localhost:5000/api";

  const fetchVotes = async () => {
    try {
      setLoadingVotes(true);
      const res = await axios.get(`${API_BASE}/votes`);
      setVotes(res.data.votes || []);
    } catch (error) {
      console.error("Fetch votes error (history):", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load votes. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoadingVotes(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  const loadingAny = loadingVotes;

  const goBackToManagement = () => {
    navigate("/voting");
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
      fontWeight: 500,
      border: "none",
    };

    if (record.hasEnded) {
      return (
        <Tag color="red" style={baseStyle} icon={<ExclamationCircleOutlined />}>
          Ended
        </Tag>
      );
    }
    if (record.isActive) {
      return (
        <Tag color="green" style={baseStyle} icon={<CheckCircleOutlined />}>
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

  const openReportPage = (vote) => {
    navigate(`/voting/${vote._id}/report`);
  };

  // Winner modal helpers (same as Voting Management)
  const openWinnerModal = async (vote) => {
    try {
      setCurrentWinnerVote(vote);
      setWinnerModalVisible(true);
      setWinnerModalLoading(true);

      const res = await axios.get(`${API_BASE}/votes/${vote._id}/winners`);
      setWinnerData(res.data);
    } catch (error) {
      console.error("Fetch winners error (history):", error);
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
  };

  const handleMarkWinner = (location, nominee) => {
    if (!winnerData || !winnerData.vote) return;

    if (!winnerData.vote.hasEnded) {
      message.warning(
        "Winner can only be announced after the voting cycle has ended."
      );
      return;
    }

    // Only allow manual selection when there is a tie and nominee is in the top group
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

          // Reload winners
          const res = await axios.get(
            `${API_BASE}/votes/${winnerData.vote._id}/winners`
          );
          setWinnerData(res.data);
        } catch (error) {
          console.error("Announce winner error (history):", error);
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
        style={{
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden",
          marginBottom: 12,
        }}
        bodyStyle={{ padding: 14 }}
      >
        <Row align="middle" justify="space-between" gutter={[12, 12]}>
          <Col>
            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: 14 }}>
                {name} <Text type="secondary">({code})</Text>
              </Text>
              <Text type="secondary">
                Total votes in this store: <Text strong>{totalVotes}</Text>
              </Text>
            </Space>
          </Col>

          <Col>
            {officialWinner ? (
              <Space direction="vertical" size={4} align="end">
                <Tag color="green" icon={<TrophyOutlined />}>
                  Winner{officialWinner.isAuto ? " (auto)" : ""}
                </Tag>
                <Text strong>
                  {officialWinner.firstName} {officialWinner.lastName}{" "}
                  <Text type="secondary">({officialWinner.employeeId})</Text>
                </Text>
                <Space size={8} wrap>
                  <Tag>
                    Votes: <Text strong>{officialWinner.locationVotes}</Text>
                  </Tag>
                  <Tag>
                    Points: <Text strong>{officialWinner.locationPoints}</Text>
                  </Tag>
                  <Tag>
                    Store %:{" "}
                    <Text strong>
                      {officialWinner.locationPercentage.toFixed(1)}%
                    </Text>
                  </Tag>
                </Space>
              </Space>
            ) : topNominees && topNominees.length > 0 ? (
              <Space direction="vertical" size={4} align="end">
                <Tag color="gold">
                  {voteHasEnded ? "Top votes (tie)" : "Current leader"}
                </Tag>
                <Space size={10} wrap>
                  {topNominees.map((n) => (
                    <Text key={n._id} strong>
                      {n.firstName} {n.lastName}{" "}
                      <Text type="secondary">({n.employeeId})</Text>
                    </Text>
                  ))}
                </Space>
              </Space>
            ) : (
              <Tag color="default">No votes yet</Tag>
            )}
          </Col>
        </Row>

        {(isTie && voteHasEnded) || (!voteHasEnded && voteIsActive) ? (
          <>
            <Divider style={{ margin: "12px 0" }} />
            {isTie && voteHasEnded && (
              <Text type="warning" style={{ display: "block" }}>
                Tie detected – please mark the official winner from the top
                nominees below.
              </Text>
            )}
            {!voteHasEnded && voteIsActive && (
              <Text type="secondary" style={{ display: "block" }}>
                Voting is still active. Showing current leaders based on highest
                votes so far.
              </Text>
            )}
          </>
        ) : (
          <Divider style={{ margin: "12px 0" }} />
        )}

        {nominees && nominees.length > 0 ? (
          <List
            dataSource={nominees}
            itemLayout="vertical"
            renderItem={(nominee) => {
              const isOfficial =
                officialWinner &&
                String(officialWinner._id) === String(nominee._id);

              const canMark =
                isTie &&
                voteHasEnded &&
                nominee.isTop &&
                nominee.locationVotes > 0;

              return (
                <List.Item
                  key={nominee._id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                  extra={
                    <Button
                      size="small"
                      type={isOfficial ? "primary" : "default"}
                      disabled={!canMark}
                      onClick={() => handleMarkWinner(location, nominee)}
                    >
                      {isOfficial ? "Official winner" : "Mark as winner"}
                    </Button>
                  }
                >
                  <Space direction="vertical" size={4} style={{ width: "100%" }}>
                    <Space size={8} wrap>
                      {nominee.isTop && (
                        <Tag color="gold" style={{ borderRadius: 999 }}>
                          Top votes
                        </Tag>
                      )}
                      <Text strong>
                        {nominee.firstName} {nominee.lastName}
                      </Text>
                      <Text type="secondary">({nominee.employeeId})</Text>
                      {isOfficial && (
                        <Tag color="green" style={{ borderRadius: 999 }}>
                          Official winner
                        </Tag>
                      )}
                    </Space>

                    <Row gutter={[12, 8]}>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Store Votes"
                          value={nominee.locationVotes}
                        />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic title="Points" value={nominee.locationPoints} />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Store %"
                          value={nominee.locationPercentage.toFixed(1)}
                          suffix="%"
                        />
                      </Col>
                    </Row>

                    <Row gutter={[12, 8]}>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Total Votes (All Stores)"
                          value={nominee.totalVotes}
                        />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Total Points"
                          value={nominee.totalPoints}
                        />
                      </Col>
                      <Col xs={24} sm={8}>
                        <Statistic
                          title="Overall %"
                          value={nominee.overallPercentage.toFixed(1)}
                          suffix="%"
                        />
                      </Col>
                    </Row>
                  </Space>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No nominees found for this store."
          />
        )}
      </Card>
    );
  };

  // All votes ever, newest first
  const allVotesList = useMemo(() => {
    const list = [...votes];
    return list.sort(
      (a, b) =>
        new Date(b.startAt || b.createdAt || 0).getTime() -
        new Date(a.startAt || a.createdAt || 0).getTime()
    );
  }, [votes]);

  const columns = [
    {
      title: "Vote",
      dataIndex: "name",
      key: "name",
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: "Locations",
      key: "locations",
      render: (_, record) =>
        record.locations && record.locations.length > 0 ? (
          <Space size={6} wrap>
            {record.locations.slice(0, 3).map((loc) => (
              <Tag key={loc._id || loc.name} style={{ borderRadius: 999 }}>
                {loc.name}
              </Tag>
            ))}
            {record.locations.length > 3 && (
              <Tag style={{ borderRadius: 999 }}>
                +{record.locations.length - 3} more
              </Tag>
            )}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Window",
      key: "window",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary">
            <CalendarOutlined /> Start: {formatDateTimeUK(record.startAt)}
          </Text>
          <Text type="secondary">
            <CalendarOutlined /> End: {formatDateTimeUK(record.endAt)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Progress",
      key: "progress",
      render: (_, record) => (
        <Space size={10} wrap>
          <Tag style={{ borderRadius: 999 }} icon={<UsergroupAddOutlined />}>
            Voters: <Text strong>{record.totalVoters || 0}</Text>
          </Tag>
          <Tag style={{ borderRadius: 999 }}>
            Voted: <Text strong>{record.totalVotesCast || 0}</Text>
          </Tag>
          <Tag style={{ borderRadius: 999 }}>
            Remaining: <Text strong>{record.remainingVoters || 0}</Text>
          </Tag>
        </Space>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => renderStatusTag(record),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 260,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyVoteLink(record)}
          >
            Copy
          </Button>
          <Button
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => openReportPage(record)}
          >
            Report
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<TrophyOutlined />}
            onClick={() => openWinnerModal(record)}
          >
            Winner
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ padding: 16 }}>
        <Card
          style={{
            width: 1200,
            maxWidth: "100%",
            margin: "0 auto",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.06)",
            background:
              "linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #eff6ff 100%)",
          }}
          bodyStyle={{ padding: 22 }}
        >
          <div
            style={{
              marginBottom: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Space direction="vertical" size={2}>
              <Title level={3} style={{ margin: 0 }}>
                Voting History
              </Title>
              <Text type="secondary">
                Browse all votes created so far and access reports or winners.
              </Text>
            </Space>

            <Button icon={<ArrowLeftOutlined />} onClick={goBackToManagement}>
              Back to Voting Management
            </Button>
          </div>

          {loadingAny ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : allVotesList.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No votes found. Create a new vote in Voting Management to see it here."
            />
          ) : (
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={allVotesList}
              loading={loadingAny}
              pagination={false}
              size="middle"
              scroll={{ x: 1100 }}
              style={{
                borderRadius: 12,
                overflow: "hidden",
              }}
            />
          )}
        </Card>
      </div>

      {/* Winner Modal */}
      <Modal
        title={
          currentWinnerVote ? `Winner - ${currentWinnerVote.name}` : "Winner"
        }
        open={winnerModalVisible}
        onCancel={closeWinnerModal}
        footer={null}
        width={920}
        styles={{
          body: { paddingTop: 10 },
        }}
      >
        {winnerModalLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !winnerData ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No winner data available for this vote yet."
          />
        ) : (
          <>
            {/* Vote Summary */}
            <Card
              style={{
                borderRadius: 14,
                marginBottom: 14,
                border: "1px solid rgba(0,0,0,0.06)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={10}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary">Vote</Text>
                    <Text strong style={{ fontSize: 16 }}>
                      {winnerData.vote.name}
                    </Text>
                    <Text type="secondary">
                      <CalendarOutlined />{" "}
                      {formatDateTimeUK(winnerData.vote.startAt)} —{" "}
                      {formatDateTimeUK(winnerData.vote.endAt)}
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} md={14}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Status"
                        value={
                          winnerData.vote.isActive
                            ? "Active"
                            : winnerData.vote.hasEnded
                            ? "Ended"
                            : "Upcoming"
                        }
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Locations"
                        value={(winnerData.locations || []).length}
                        prefix={<EnvironmentOutlined />}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic title="Tie Handling" value="Manual when tie" />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {/* Locations */}
            {winnerData.locations && winnerData.locations.length > 0 ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {winnerData.locations.map((loc) => renderWinnerLocationCard(loc))}
              </Space>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No locations configured for this vote."
              />
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default VotingHistoryPage;
