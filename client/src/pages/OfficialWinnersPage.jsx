// client/src/pages/OfficialWinnersPage.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import API_BASE_URL from "../config/api";

const { Title, Text } = Typography;

const OfficialWinnersPage = () => {
  const { voteId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOfficialWinners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/votes/${voteId}/official-winners`
      );
      setData(res.data);
    } catch (error) {
      console.error("Fetch official winners error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to load official winners.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficialWinners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteId]);

  const goBack = () => {
    navigate("/winners");
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return "-";
    }
  };

  return (
    <Card
      style={{
        width: "100%",
        maxWidth: 1000,
        margin: "0 auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            Official Winners
          </Title>
          <Text type="secondary">
            Announced winners from the current voting phase.
          </Text>
        </div>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={goBack}
        >
          Back to Winners
        </Button>
      </div>

      {!data && loading && <Text>Loading winners...</Text>}

      {data && (
        <>
          <Card type="inner" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={4}>
              <Text>
                <strong>Vote:</strong> {data.vote?.name || "-"}
              </Text>
              <Text>
                <strong>Voting window:</strong>{" "}
                {formatDateTime(data.vote?.startAt)} —{" "}
                {formatDateTime(data.vote?.endAt)}
              </Text>
            </Space>
          </Card>

          {(!data.locations || data.locations.length === 0) && (
            <Text type="secondary">
              No locations found for this vote.
            </Text>
          )}

          {data.locations &&
            data.locations.map((loc) => (
              <Card
                key={loc.locationId}
                type="inner"
                title={`${loc.name} (${loc.code})`}
                style={{ marginBottom: 12 }}
              >
                <Text style={{ display: "block", marginBottom: 8 }}>
                  <strong>Total votes in this store:</strong>{" "}
                  {loc.totalVotes}
                </Text>

                {!loc.winner && (
                  <Text type="secondary">
                    No official winner announced yet for this store.
                  </Text>
                )}

                {loc.winner && (
                  <Space direction="vertical" size={4}>
                    <Text>
                      <strong>Winner:</strong>{" "}
                      {loc.winner.firstName} {loc.winner.lastName} (
                      {loc.winner.employeeId})
                    </Text>
                    <Text type="secondary">
                      Store votes:{" "}
                      <strong>{loc.winner.locationVotes}</strong> | 
                      Store points:{" "}
                      <strong>{loc.winner.locationPoints}</strong> | 
                      Store %:{" "}
                      <strong>
                        {loc.winner.locationPercentage.toFixed(1)}%
                      </strong>
                    </Text>
                    <Text type="secondary">
                      Total votes (all stores):{" "}
                      <strong>{loc.winner.totalVotes}</strong> | Total
                      points:{" "}
                      <strong>{loc.winner.totalPoints}</strong>
                    </Text>
                  </Space>
                )}
              </Card>
            ))}
        </>
      )}
    </Card>
  );
};

export default OfficialWinnersPage;
