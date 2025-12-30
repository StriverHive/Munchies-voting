import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  message,
  Collapse,
  Divider,
  Empty,
  Skeleton,
  Row,
  Col,
  List,
  Statistic,
} from "antd";
import {
  ArrowLeftOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const WinnersHistoryPage = () => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/votes/winners/history"
      );
      setHistory(res.data.history || []);
    } catch (error) {
      console.error("Fetch winners history error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load winners history.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🔹 Back now goes to Voting Management page
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

  const renderWinnerLine = (winner) => {
    if (!winner) return null;
    return (
      <Space size={8} wrap>
        <Tag color="gold" icon={<TrophyOutlined />}>
          Winner
        </Tag>
        <Text strong>
          {winner.firstName} {winner.lastName}
        </Text>
        <Text type="secondary">({winner.employeeId})</Text>
      </Space>
    );
  };

  const collapseItems = useMemo(() => {
    return (history || []).map((entry) => {
      const vote = entry?.vote || {};
      const locations = entry?.locations || [];

      const cycleText = `${formatDateTime(vote.startAt)} — ${formatDateTime(
        vote.endAt
      )}`;

      const locationsText =
        (vote.locations || []).map((loc) => loc.name).join(", ") || "-";

      return {
        key: vote._id,
        label: (
          <Space
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 15 }}>
                {vote.name}
              </Text>
              <Space size={10} wrap>
                <Text type="secondary">
                  <CalendarOutlined /> {cycleText}
                </Text>
                <Text type="secondary">
                  <EnvironmentOutlined /> {locationsText}
                </Text>
              </Space>
            </Space>
            <Tag color="blue">Completed</Tag>
          </Space>
        ),
        children: (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {locations.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No locations found for this vote."
              />
            ) : (
              locations.map((loc) => (
                <Card
                  key={loc.locationId}
                  size="small"
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.06)",
                    overflow: "hidden",
                  }}
                  bodyStyle={{ padding: 14 }}
                >
                  <Row align="middle" justify="space-between" gutter={[12, 12]}>
                    <Col>
                      <Space direction="vertical" size={2}>
                        <Text strong style={{ fontSize: 14 }}>
                          {loc.name}{" "}
                          <Text type="secondary" style={{ fontWeight: 400 }}>
                            ({loc.code})
                          </Text>
                        </Text>
                        <Text type="secondary">
                          Total votes in this store:{" "}
                          <Text strong>{loc.totalVotes}</Text>
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      {loc.winner ? (
                        <Space direction="vertical" size={2} align="end">
                          {renderWinnerLine(loc.winner)}
                          <Space size={12} wrap>
                            <Tag color="default">
                              Votes:{" "}
                              <Text strong>{loc.winner.locationVotes}</Text>
                            </Tag>
                            <Tag color="default">
                              Points:{" "}
                              <Text strong>{loc.winner.locationPoints}</Text>
                            </Tag>
                            <Tag color="default">
                              Store %:{" "}
                              <Text strong>
                                {Number(loc.winner.locationPercentage).toFixed(
                                  1
                                )}
                                %
                              </Text>
                            </Tag>
                          </Space>
                        </Space>
                      ) : (
                        <Tag color="default">No official winner announced</Tag>
                      )}
                    </Col>
                  </Row>

                  <Divider style={{ margin: "12px 0" }} />

                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                    wrap
                  >
                    <Space size={8}>
                      <UserOutlined />
                      <Text strong>Nominees</Text>
                      <Text type="secondary">
                        ({(loc.nominees || []).length})
                      </Text>
                    </Space>
                  </Space>

                  {(loc.nominees || []).length > 0 ? (
                    <List
                      itemLayout="horizontal"
                      style={{ marginTop: 8 }}
                      dataSource={loc.nominees || []}
                      renderItem={(nom) => {
                        const isWinner =
                          loc.winner &&
                          String(loc.winner._id) === String(nom._id);

                        return (
                          <List.Item
                            style={{
                              padding: "10px 0",
                              borderBottom: "1px solid rgba(0,0,0,0.05)",
                            }}
                          >
                            <List.Item.Meta
                              title={
                                <Space size={8} wrap>
                                  {isWinner && (
                                    <Tag color="green" icon={<TrophyOutlined />}>
                                      Winner
                                    </Tag>
                                  )}
                                  <Text strong>
                                    {nom.firstName} {nom.lastName}
                                  </Text>
                                  <Text type="secondary">
                                    ({nom.employeeId})
                                  </Text>
                                </Space>
                              }
                              description={
                                <Row gutter={[12, 8]}>
                                  <Col xs={24} sm={8}>
                                    <Statistic
                                      title="Store Votes"
                                      value={nom.locationVotes}
                                    />
                                  </Col>
                                  <Col xs={24} sm={8}>
                                    <Statistic
                                      title="Points"
                                      value={nom.locationPoints}
                                    />
                                  </Col>
                                  <Col xs={24} sm={8}>
                                    <Statistic
                                      title="Store %"
                                      value={Number(
                                        nom.locationPercentage
                                      ).toFixed(1)}
                                      suffix="%"
                                    />
                                  </Col>
                                </Row>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty
                      style={{ marginTop: 10 }}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No nominees found for this store."
                    />
                  )}
                </Card>
              ))
            )}
          </Space>
        ),
      };
    });
  }, [history]);

  return (
    <div style={{ padding: 16 }}>
      <Card
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          borderRadius: 14,
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
        bodyStyle={{ padding: 18 }}
      >
        <div
          style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Space direction="vertical" size={2}>
            <Title level={3} style={{ marginBottom: 0 }}>
              Winner History
            </Title>
            <Text type="secondary">
              All completed voting phases with store winners and nominee stats.
            </Text>
          </Space>

          <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
            Back to Voting
          </Button>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : history.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No completed votes found yet."
          />
        ) : (
          <Collapse
            items={collapseItems}
            accordion
            bordered={false}
            style={{
              background: "transparent",
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default WinnersHistoryPage;
