// client/src/pages/DashboardPage.jsx
import React from "react";
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  EnvironmentOutlined,
  TeamOutlined,
  CrownOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const DashboardPage = ({ user }) => {
  const navigate = useNavigate();

  const goLocations = () => navigate("/locations");
  const goEmployees = () => navigate("/employees");
  const goVoting = () => navigate("/voting");
  const goWinners = () => navigate("/winners");

  const displayName = user?.username || user?.email || "User";

  const mainCardStyle = {
    width: "100%",
    borderRadius: 20,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
    border: "none",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    minHeight: "calc(100vh - 180px)",
    position: "relative",
    overflow: "hidden",
  };

  const actionCardStyle = {
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    border: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    height: "100%",
    background: "#ffffff",
  };

  const actionCardHoverStyle = {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.12)",
  };

  const iconBadgeStyle = (color1, color2) => ({
    width: 56,
    height: 56,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, ${color1}, ${color2})`,
    color: "#fff",
    fontSize: 24,
    boxShadow: `0 8px 16px ${color1}40`,
  });

  const cardColors = {
    locations: { primary: "#3b82f6", secondary: "#2563eb" },
    employees: { primary: "#8b5cf6", secondary: "#7c3aed" },
    voting: { primary: "#ec4899", secondary: "#db2777" },
    winners: { primary: "#f59e0b", secondary: "#d97706" },
  };

  // Logo background overlay
  const logoOverlayStyle = {
    position: "absolute",
    top: "50%",
    right: "-10%",
    transform: "translateY(-50%)",
    width: "60%",
    height: "auto",
    opacity: 0.03,
    pointerEvents: "none",
    zIndex: 0,
  };

  const contentWrapperStyle = {
    position: "relative",
    zIndex: 1,
  };

  return (
    <Card style={mainCardStyle} bodyStyle={{ padding: 32 }}>
      {/* Background Logo */}
      <img
        src="/munchies-logo.png"
        alt=""
        style={logoOverlayStyle}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />

      <div style={contentWrapperStyle}>
        {/* Header Section */}
        <div
          style={{
            marginBottom: 48,
            paddingBottom: 24,
            borderBottom: "2px solid #e2e8f0",
          }}
        >
          <Title
            level={2}
            style={{
              marginBottom: 8,
              color: "#0f172a",
              fontWeight: 700,
              fontSize: 32,
            }}
          >
            Welcome back, {displayName}! 👋
          </Title>
          <Text
            style={{
              fontSize: 16,
              color: "#64748b",
              display: "block",
            }}
          >
            Manage your voting operations from this central hub. Select an
            option below to get started.
          </Text>
        </div>

        {/* Quick Actions Grid */}
        <Row gutter={[24, 24]}>
          {/* Locations Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={actionCardStyle}
              bodyStyle={{ padding: 24 }}
              onClick={goLocations}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, actionCardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(0, 0, 0, 0.06)";
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(
                    cardColors.locations.primary,
                    cardColors.locations.secondary
                  )}
                >
                  <EnvironmentOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      marginBottom: 8,
                      color: "#1e293b",
                      fontWeight: 600,
                    }}
                  >
                    Locations
                  </Title>
                  <Text
                    style={{
                      color: "#64748b",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Add and manage store branches for voting sessions
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Employees Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={actionCardStyle}
              bodyStyle={{ padding: 24 }}
              onClick={goEmployees}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, actionCardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(0, 0, 0, 0.06)";
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(
                    cardColors.employees.primary,
                    cardColors.employees.secondary
                  )}
                >
                  <TeamOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      marginBottom: 8,
                      color: "#1e293b",
                      fontWeight: 600,
                    }}
                  >
                    Employees
                  </Title>
                  <Text
                    style={{
                      color: "#64748b",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Manage employee details and perform bulk imports
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Voting Management Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={actionCardStyle}
              bodyStyle={{ padding: 24 }}
              onClick={goVoting}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, actionCardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(0, 0, 0, 0.06)";
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(
                    cardColors.voting.primary,
                    cardColors.voting.secondary
                  )}
                >
                  <BarChartOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      marginBottom: 8,
                      color: "#1e293b",
                      fontWeight: 600,
                    }}
                  >
                    Voting Management
                  </Title>
                  <Text
                    style={{
                      color: "#64748b",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Create and monitor voting sessions for each store
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Winners Card */}
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={actionCardStyle}
              bodyStyle={{ padding: 24 }}
              onClick={goWinners}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, actionCardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(0, 0, 0, 0.06)";
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(
                    cardColors.winners.primary,
                    cardColors.winners.secondary
                  )}
                >
                  <CrownOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      marginBottom: 8,
                      color: "#1e293b",
                      fontWeight: 600,
                    }}
                  >
                    Winners
                  </Title>
                  <Text
                    style={{
                      color: "#64748b",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Review store winners and manage tiebreak decisions
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Optional: Quick Stats Section */}
        <Row
          gutter={[24, 24]}
          style={{
            marginTop: 32,
            padding: "24px 0",
          }}
        >
          <Col span={24}>
            <Card
              style={{
                borderRadius: 16,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Title
                    level={4}
                    style={{
                      color: "#ffffff",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    Ready to manage your voting operations?
                  </Title>
                  <Text style={{ color: "#e9d5ff", fontSize: 14 }}>
                    All your voting management tools are just one click away
                  </Text>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default DashboardPage;