import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  message,
  Select,
  Skeleton,
  Empty,
  Divider,
  Row,
  Col,
  Statistic,
  List,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  HistoryOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FireOutlined,
  InfoCircleOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;

const WinnersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [allVotes, setAllVotes] = useState([]);
  const [relevantVotes, setRelevantVotes] = useState([]);
  const [loadingVotes, setLoadingVotes] = useState(false);

  const [currentData, setCurrentData] = useState(null);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [selectedVoteId, setSelectedVoteId] = useState(null);

  const [selectedNominee, setSelectedNominee] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [statsModalVisible, setStatsModalVisible] = useState(false);

  const voteIdFromQuery = searchParams.get("voteId");

  const fetchCurrentWinners = async (vote) => {
    if (!vote) {
      setCurrentData(null);
      return;
    }

    try {
      setLoadingWinners(true);
      const res = await axios.get(
        `http://localhost:5000/api/votes/${vote._id}/winners`
      );
      setCurrentData(res.data);
    } catch (error) {
      console.error("Fetch winners error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load winners for this vote.";
      message.error(errorMessage);
    } finally {
      setLoadingWinners(false);
    }
  };

  const fetchVotes = async (preferredVoteId) => {
    try {
      setLoadingVotes(true);
      const res = await axios.get("http://localhost:5000/api/votes");
      const votes = res.data.votes || [];
      setAllVotes(votes);

      // If a specific voteId is passed (from Voting Management "Winner" button)
      // we prioritise that vote ONLY, regardless of status (active/ended).
      if (preferredVoteId) {
        const target = votes.find((v) => v._id === preferredVoteId);
        if (target) {
          setRelevantVotes([target]);
          setSelectedVoteId(target._id);
          await fetchCurrentWinners(target);
          return;
        }
      }

      // Default behaviour: show only active or ended-with-tie votes
      const relevant = votes.filter((v) => v.isActive || (v.hasEnded && v.hasUnresolvedTie));
      setRelevantVotes(relevant);

      if (relevant.length > 0) {
        const first = relevant[0];
        setSelectedVoteId(first._id);
        await fetchCurrentWinners(first);
      } else {
        setSelectedVoteId(null);
        setCurrentData(null);
      }
    } catch (error) {
      console.error("Fetch votes error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load votes for winners.";
      message.error(errorMessage);
    } finally {
      setLoadingVotes(false);
    }
  };

  useEffect(() => {
    fetchVotes(voteIdFromQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteIdFromQuery]);

  const handleSelectVote = async (value) => {
    setSelectedVoteId(value);
    const vote = relevantVotes.find((v) => v._id === value);
    if (vote) {
      await fetchCurrentWinners(vote);
    } else {
      setCurrentData(null);
    }
  };

  const goBackDashboard = () => {
    navigate("/dashboard");
  };

  const goHistory = () => {
    navigate("/winners/history");
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "-";
    }
  };

  const openStatsModal = (location, nominee) => {
    setSelectedLocation(location);
    setSelectedNominee(nominee);
    setStatsModalVisible(true);
  };

  const closeStatsModal = () => {
    setStatsModalVisible(false);
    setSelectedLocation(null);
    setSelectedNominee(null);
  };

  const handleMarkWinner = (location, nominee) => {
    if (!currentData || !currentData.vote) return;

    if (!currentData.vote.hasEnded) {
      message.warning("Winner can only be announced after the voting cycle has ended.");
      return;
    }

    // Only allow manual selection when there is a tie
    if (!location.isTie || !nominee.isTop) {
      message.warning("Manual winner selection is only allowed for nominees in a tie.");
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
            `http://localhost:5000/api/votes/${currentData.vote._id}/announce-winner`,
            {
              locationId: location.locationId,
              nomineeId: nominee._id,
            }
          );
          message.success("Winner announced successfully");
          navigate(`/winners/${currentData.vote._id}/official`);
        } catch (error) {
          console.error("Announce winner error:", error);
          const errorMessage =
            error.response?.data?.message || "Failed to announce winner.";
          message.error(errorMessage);
        }
      },
    });
  };

  const renderVoteStatusLabel = (vote) => {
    if (vote.isActive) return "Active";
    if (vote.hasEnded && vote.hasUnresolvedTie) return "Ended – tie pending";
    if (vote.hasEnded) return "Ended";
    return "Upcoming";
  };

  const renderVoteStatusTag = (vote) => {
    const baseStyle = { borderRadius: 999, padding: "2px 10px", fontSize: 12, border: "none" };
    if (vote.isActive) return <Tag color="green" style={baseStyle}>Active</Tag>;
    if (vote.hasEnded && vote.hasUnresolvedTie)
      return <Tag color="gold" style={baseStyle}>Tie pending</Tag>;
    if (vote.hasEnded) return <Tag color="red" style={baseStyle}>Ended</Tag>;
    return <Tag style={baseStyle}>Upcoming</Tag>;
  };

  const voteTitle =
    currentData && currentData.vote ? currentData.vote.name : "No vote selected";

  const voteHasEnded = currentData?.vote?.hasEnded;
  const voteIsActive = currentData?.vote?.isActive;

  const headerRight = (
    <Space direction="vertical" size={10} style={{ alignItems: "flex-end" }}>
      <Select
        style={{ minWidth: 320 }}
        placeholder="Select a vote"
        value={selectedVoteId || undefined}
        onChange={handleSelectVote}
        disabled={loadingVotes || relevantVotes.length === 0}
        showSearch
        optionFilterProp="children"
      >
        {relevantVotes.map((v) => (
          <Option key={v._id} value={v._id}>
            {v.name} {" ("}
            {renderVoteStatusLabel(v)}
            {")"}
          </Option>
        ))}
      </Select>

      <Space wrap>
        <Button icon={<HistoryOutlined />} onClick={goHistory}>
          Winner History
        </Button>
        <Button icon={<ArrowLeftOutlined />} onClick={goBackDashboard}>
          Back to Dashboard
        </Button>
      </Space>
    </Space>
  );

  const locationsList = currentData?.vote?.locations?.map((l) => l.name).join(", ") || "-";

  const summaryCard = (
    <Card
      style={{
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.06)",
        marginBottom: 16,
      }}
      bodyStyle={{ padding: 14 }}
    >
      {loadingVotes || loadingWinners ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : !currentData ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No active or tie-pending votes found, or the selected vote is not available. Create a vote or check Winner History for past winners."
        />
      ) : (
        <>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10}>
              <Space direction="vertical" size={4}>
                <Space size={10} wrap>
                  <Title level={4} style={{ margin: 0 }}>
                    {voteTitle}
                  </Title>
                  {renderVoteStatusTag(currentData.vote)}
                </Space>

                <Text type="secondary">
                  <CalendarOutlined /> {formatDateTime(currentData.vote.startAt)} —{" "}
                  {formatDateTime(currentData.vote.endAt)}
                </Text>

                <Text type="secondary">
                  <EnvironmentOutlined /> {locationsList}
                </Text>

                <Space size={8} wrap>
                  <Tag icon={<FireOutlined />} style={{ borderRadius: 999 }}>
                    Vote points: <Text strong>{currentData.vote.votePoints}</Text>
                  </Tag>

                  {!voteHasEnded && (
                    <Tag style={{ borderRadius: 999 }} icon={<InfoCircleOutlined />}>
                      Finalize winners after end
                    </Tag>
                  )}
                </Space>
              </Space>
            </Col>

            <Col xs={24} md={14}>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Stores"
                    value={(currentData.locations || []).length || 0}
                    prefix={<EnvironmentOutlined />}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Tie Stores"
                    value={(currentData.locations || []).filter((l) => l.isTie).length}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Statistic
                    title="Nominees"
                    value={
                      (currentData.locations || []).reduce(
                        (sum, l) => sum + (l.nominees ? l.nominees.length : 0),
                        0
                      ) || 0
                    }
                    prefix={<CrownOutlined />}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </>
      )}
    </Card>
  );

  const renderLocationCard = (location) => {
    const { name, code, totalVotes, topNominees, nominees, officialWinner, isTie } = location;

    const topNames =
      topNominees && topNominees.length > 0
        ? topNominees.map((n) => `${n.firstName} ${n.lastName}`).join(", ")
        : null;

    return (
      <Card
        key={location.locationId}
        style={{
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.06)",
          marginBottom: 12,
          overflow: "hidden",
        }}
        bodyStyle={{ padding: 14 }}
        title={
          <Space size={10} wrap>
            <Text strong style={{ fontSize: 14 }}>
              {name} <Text type="secondary">({code})</Text>
            </Text>
            <Tag style={{ borderRadius: 999 }}>
              Total votes: <Text strong>{totalVotes}</Text>
            </Tag>
            {officialWinner ? (
              <Tag color="green" style={{ borderRadius: 999 }} icon={<TrophyOutlined />}>
                Winner{officialWinner.isAuto ? " (auto)" : ""}
              </Tag>
            ) : isTie && voteHasEnded ? (
              <Tag color="gold" style={{ borderRadius: 999 }}>
                Tie pending
              </Tag>
            ) : null}
          </Space>
        }
      >
        {topNames ? (
          <Text style={{ display: "block", marginBottom: 10 }}>
            <strong>{voteIsActive ? "Current leader(s):" : "Currently highest votes:"}</strong>{" "}
            {topNames}
          </Text>
        ) : (
          <Text type="secondary" style={{ display: "block", marginBottom: 10 }}>
            No votes have been cast in this store yet.
          </Text>
        )}

        {officialWinner && (
          <Card
            style={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.06)",
              background: "rgba(34,197,94,0.06)",
              marginBottom: 12,
            }}
            bodyStyle={{ padding: 12 }}
          >
            <Space size={10} wrap>
              <TrophyOutlined />
              <Text strong>
                {officialWinner.firstName} {officialWinner.lastName}
              </Text>
              <Text type="secondary">({officialWinner.employeeId})</Text>
            </Space>
          </Card>
        )}

        {isTie && voteHasEnded && (
          <Text type="warning" style={{ display: "block", marginBottom: 10 }}>
            Tie detected in this store – choose the official winner from the top nominees.
          </Text>
        )}

        <Divider style={{ margin: "10px 0" }} />

        <Space size={8} style={{ marginBottom: 8 }}>
          <CrownOutlined />
          <Text strong>Nominees</Text>
          <Text type="secondary">({(nominees || []).length})</Text>
        </Space>

        {nominees && nominees.length > 0 ? (
          <List
            dataSource={nominees}
            itemLayout="vertical"
            renderItem={(nominee) => {
              const isOfficial =
                officialWinner && String(officialWinner._id) === String(nominee._id);

              const canMark =
                isTie && voteHasEnded && nominee.isTop && nominee.locationVotes > 0;

              return (
                <List.Item
                  key={`${location.locationId}-${nominee._id}`}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                  extra={
                    <Space direction="vertical" size={6}>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => openStatsModal(location, nominee)}
                      >
                        View stats
                      </Button>
                      <Button
                        size="small"
                        type={isOfficial ? "primary" : "default"}
                        disabled={!canMark}
                        onClick={() => handleMarkWinner(location, nominee)}
                      >
                        {isOfficial ? "Official winner" : "Mark as winner"}
                      </Button>
                    </Space>
                  }
                >
                  <Space direction="vertical" size={4} style={{ width: "100%" }}>
                    <Space size={8} wrap>
                      {nominee.isTop && (
                        <Tag color="gold" style={{ borderRadius: 999 }}>
                          {voteHasEnded ? "Top votes" : "Current winner"}
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

                    <Space size={10} wrap>
                      <Tag style={{ borderRadius: 999 }}>
                        Store votes: <Text strong>{nominee.locationVotes}</Text>
                      </Tag>
                      <Tag style={{ borderRadius: 999 }}>
                        Points: <Text strong>{nominee.locationPoints}</Text>
                      </Tag>
                      <Tag style={{ borderRadius: 999 }}>
                        Store %:{" "}
                        <Text strong>{nominee.locationPercentage.toFixed(1)}%</Text>
                      </Tag>
                    </Space>

                    <Text type="secondary">
                      Total votes (all stores): <strong>{nominee.totalVotes}</strong> | Total
                      points: <strong>{nominee.totalPoints}</strong> | Overall %:{" "}
                      <strong>{nominee.overallPercentage.toFixed(1)}%</strong>
                    </Text>
                  </Space>
                </List.Item>
              );
            }}
          />
        ) : (
          <Text type="secondary">No nominees found for this store.</Text>
        )}

        {!voteHasEnded && (
          <Text type="secondary" style={{ display: "block", marginTop: 10 }}>
            ⚠ You can only finalize winners after the voting cycle has ended.
          </Text>
        )}
      </Card>
    );
  };

  return (
    <>
      <div style={{ padding: 16 }}>
        <Card
          style={{
            width: "100%",
            maxWidth: 1100,
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
                Winners & Results
              </Title>
              <Text type="secondary">
                View nominees, current leaders, and resolve ties by announcing winners.
              </Text>
            </Space>

            {headerRight}
          </div>

          {/* Summary */}
          {summaryCard}

          {/* Locations */}
          {currentData && currentData.locations && currentData.locations.length > 0 && (
            <div>{currentData.locations.map((loc) => renderLocationCard(loc))}</div>
          )}

          {currentData && currentData.locations && currentData.locations.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No locations configured for this vote."
            />
          )}
        </Card>
      </div>

      {/* Stats modal */}
      <Modal
        title={
          selectedNominee && selectedLocation ? (
            <>
              {selectedNominee.firstName} {selectedNominee.lastName} (
              {selectedNominee.employeeId}) – {selectedLocation.name}(
              {selectedLocation.code})
            </>
          ) : (
            "Nominee stats"
          )
        }
        open={statsModalVisible}
        onCancel={closeStatsModal}
        footer={null}
        width={720}
        styles={{ body: { paddingTop: 10 } }}
      >
        {selectedNominee && selectedLocation ? (
          <>
            <Card
              style={{
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
                marginBottom: 12,
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #eff6ff 100%)",
              }}
              bodyStyle={{ padding: 14 }}
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={8}>
                  <Statistic title="Store Votes" value={selectedNominee.locationVotes} />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic title="Store Points" value={selectedNominee.locationPoints} />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Store %"
                    value={Number(selectedNominee.locationPercentage.toFixed(1))}
                    suffix="%"
                  />
                </Col>
              </Row>
            </Card>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Store">
                {selectedLocation.name} ({selectedLocation.code})
              </Descriptions.Item>
              <Descriptions.Item label="Store votes">
                {selectedNominee.locationVotes}
              </Descriptions.Item>
              <Descriptions.Item label="Store points">
                {selectedNominee.locationPoints}
              </Descriptions.Item>
              <Descriptions.Item label="Store percentage">
                {selectedNominee.locationPercentage.toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="Total votes (all stores)">
                {selectedNominee.totalVotes}
              </Descriptions.Item>
              <Descriptions.Item label="Total points (all stores)">
                {selectedNominee.totalPoints}
              </Descriptions.Item>
              <Descriptions.Item label="Overall percentage">
                {selectedNominee.overallPercentage.toFixed(1)}%
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <Text type="secondary">No nominee selected.</Text>
        )}
      </Modal>
    </>
  );
};

export default WinnersPage;
