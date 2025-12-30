// client/src/pages/VotingReportPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Table,
  Space,
  Button,
  message,
  Modal,
  Tag,
  Empty,
  Skeleton,
  Divider,
  Row,
  Col,
  Statistic,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config/api";

const { Title, Text } = Typography;

const VotingReportPage = () => {
  const { voteId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // 🔹 Voters modal state
  const [votersModalVisible, setVotersModalVisible] = useState(false);
  const [votersModalLoading, setVotersModalLoading] = useState(false);
  const [voterDetails, setVoterDetails] = useState([]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/votes/${voteId}/report`
      );
      setReportData(res.data);
    } catch (error) {
      console.error("Fetch vote report error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load report. Please go back and try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteId]);

  const goBack = () => {
    navigate("/voting");
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "-";
    }
  };

  const participationRate =
    reportData && reportData.vote && reportData.vote.totalVoters > 0
      ? (reportData.vote.totalBallots / reportData.vote.totalVoters) * 100
      : 0;

  // 🔹 Open voters modal
  const openVotersModal = async () => {
    try {
      setVotersModalVisible(true);
      setVotersModalLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/votes/${voteId}/voters`
      );
      setVoterDetails(res.data.voters || []);
    } catch (error) {
      console.error("Fetch vote voters error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load voters for this vote.";
      message.error(errorMessage);
      setVotersModalVisible(false);
      setVoterDetails([]);
    } finally {
      setVotersModalLoading(false);
    }
  };

  const closeVotersModal = () => {
    setVotersModalVisible(false);
    setVoterDetails([]);
  };

  const voterColumns = [
    {
      title: "Name",
      key: "name",
      render: (_, record) => {
        const emp = record.employee;
        return emp ? (
          <Text strong>
            {emp.firstName} {emp.lastName}
          </Text>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Employee ID",
      key: "employeeId",
      render: (_, record) => record.employee?.employeeId || "-",
    },
    {
      title: "Email",
      key: "email",
      render: (_, record) => record.employee?.email || "-",
    },
    {
      title: "Has Voted",
      key: "hasVoted",
      render: (_, record) =>
        record.hasVoted ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Yes
          </Tag>
        ) : (
          <Tag> No </Tag>
        ),
    },
    {
      title: "Voted At",
      key: "votedAt",
      render: (_, record) =>
        record.votedAt ? formatDateTime(record.votedAt) : "-",
    },
  ];

  // Global nominees table columns (overall + per store columns)
  const getGlobalColumns = () => {
    const baseCols = [
      {
        title: "Nominee",
        key: "nominee",
        fixed: "left",
        width: 220,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text strong>
              {record.firstName} {record.lastName}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.employeeId || "-"}
            </Text>
          </Space>
        ),
      },
      {
        title: "Total Votes",
        dataIndex: "totalVotes",
        key: "totalVotes",
        width: 120,
      },
      {
        title: "Total Points",
        dataIndex: "totalPoints",
        key: "totalPoints",
        width: 120,
      },
      {
        title: "Overall %",
        key: "percentage",
        width: 110,
        render: (_, record) =>
          `${record.percentage ? record.percentage.toFixed(1) : 0}%`,
      },
    ];

    if (!reportData || !reportData.vote || !reportData.vote.locations) {
      return baseCols;
    }

    const locationCols = reportData.vote.locations.map((loc) => ({
      title: (
        <Space size={6}>
          <EnvironmentOutlined />
          <span>{loc.name}</span>
        </Space>
      ),
      key: `loc-${loc._id}`,
      width: 140,
      render: (_, record) => {
        const found =
          (record.votesByLocation || []).find(
            (v) => v.locationId === String(loc._id)
          ) || null;
        return found ? found.votes : 0;
      },
    }));

    return [...baseCols, ...locationCols];
  };

  const globalColumnsMemo = useMemo(() => getGlobalColumns(), [reportData]);

  const vote = reportData?.vote;

  return (
    <div style={{ padding: 16 }}>
      <Card
        style={{
          width: 1200,
          maxWidth: "100%",
          margin: "0 auto",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #eff6ff 100%)",
        }}
        bodyStyle={{ padding: 22 }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Space direction="vertical" size={2}>
            <Title level={3} style={{ margin: 0 }}>
              {vote?.name || "Vote Report"}
            </Title>
            <Text type="secondary">Detailed results by nominee and store.</Text>
          </Space>

          <Space wrap>
            <Button icon={<TeamOutlined />} onClick={openVotersModal}>
              Voters
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
              Back to Voting Management
            </Button>
          </Space>
        </div>

        {/* Content */}
        {loading && !reportData ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : !reportData ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No report data available. Please go back and try again."
          />
        ) : (
          <>
            {/* Summary */}
            <Card
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
                marginBottom: 16,
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} md={10}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary">
                      <CalendarOutlined /> Voting window
                    </Text>
                    <Text strong>
                      {formatDateTime(vote.startAt)} — {formatDateTime(vote.endAt)}
                    </Text>

                    <Divider style={{ margin: "10px 0" }} />

                    <Text type="secondary">
                      <EnvironmentOutlined /> Locations
                    </Text>
                    <Text>
                      {(vote.locations || []).map((l) => l.name).join(", ") || "-"}
                    </Text>

                    <Divider style={{ margin: "10px 0" }} />

                    <Space size={8} wrap>
                      <Tag icon={<ThunderboltOutlined />}>
                        Vote points: <Text strong>{vote.votePoints}</Text>
                      </Tag>
                      <Tag icon={<TrophyOutlined />}>
                        Nominees: <Text strong>{(reportData.nominees || []).length}</Text>
                      </Tag>
                    </Space>
                  </Space>
                </Col>

                <Col xs={24} md={14}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={8}>
                      <Statistic title="Total Voters" value={vote.totalVoters} />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title={
                          <Tooltip title="Employees who submitted a ballot">
                            Ballots Submitted
                          </Tooltip>
                        }
                        value={vote.totalBallots}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title={
                          <Tooltip title="Total selections across all ballots">
                            Total Selections
                          </Tooltip>
                        }
                        value={vote.totalSelections}
                      />
                    </Col>

                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Participation"
                        value={Number(participationRate.toFixed(1))}
                        suffix="%"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Remaining"
                        value={Math.max((vote.totalVoters || 0) - (vote.totalBallots || 0), 0)}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Stores"
                        value={(vote.locations || []).length || 0}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>

            {/* Overall Nominee Breakdown */}
            <Card
              title={
                <Space size={8}>
                  <TrophyOutlined />
                  <span>Overall Nominee Breakdown</span>
                </Space>
              }
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Table
                rowKey="_id"
                columns={globalColumnsMemo}
                dataSource={reportData.nominees || []}
                pagination={false}
                size="middle"
                scroll={{ x: "max-content" }}
                style={{ borderRadius: 12, overflow: "hidden" }}
              />
            </Card>
          </>
        )}

        {/* Voters Modal */}
        <Modal
          title={
            reportData?.vote?.name
              ? `Voters - ${reportData.vote.name}`
              : "Voters"
          }
          open={votersModalVisible}
          onCancel={closeVotersModal}
          footer={null}
          width={860}
          styles={{
            body: { paddingTop: 10 },
          }}
        >
          <Card
            style={{
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.06)",
            }}
            bodyStyle={{ padding: 12 }}
          >
            <Table
              rowKey={(record) => record.employee?._id || Math.random()}
              columns={voterColumns}
              dataSource={voterDetails}
              loading={votersModalLoading}
              pagination={false}
              size="middle"
              scroll={{ x: "max-content" }}
            />
          </Card>
        </Modal>
      </Card>
    </div>
  );
};

export default VotingReportPage;
