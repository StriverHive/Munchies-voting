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
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    minHeight: "calc(100vh - 180px)",
    position: "relative",
    overflow: "hidden",
  };

  const actionCardStyle = {
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    height: "100%",
    background: "#ffffff",
    cursor: "pointer",
    overflow: "hidden",
    position: "relative",
  };

  const cardHoverStyle = {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    borderColor: "#cbd5e1",
  };

  const iconBadgeStyle = (color) => ({
    width: 48,
    height: 48,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: color,
    color: "#fff",
    fontSize: 22,
    transition: "all 0.2s ease",
  });

  const cardColors = {
    locations: { primary: "#3b82f6", icon: "📍" },
    employees: { primary: "#6366f1", icon: "👥" },
    voting: { primary: "#8b5cf6", icon: "🗳️" },
    winners: { primary: "#f59e0b", icon: "🏆" },
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
              color: "#1e293b",
              fontWeight: 600,
              fontSize: 28,
            }}
          >
            Welcome back, {displayName}
          </Title>
          <Text
            style={{
              fontSize: 15,
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
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(cardColors.locations.primary)}
                >
                  <EnvironmentOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
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
                      display: "block",
                      marginTop: 8,
                    }}
                  >
                    Manage store locations
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
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(cardColors.employees.primary)}
                >
                  <TeamOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
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
                      display: "block",
                      marginTop: 8,
                    }}
                  >
                    Manage employee details
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
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(cardColors.voting.primary)}
                >
                  <BarChartOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
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
                      display: "block",
                      marginTop: 8,
                    }}
                  >
                    Create voting sessions
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
                Object.assign(e.currentTarget.style, cardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div
                  style={iconBadgeStyle(cardColors.winners.primary)}
                >
                  <CrownOutlined />
                </div>
                <div>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
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
                      display: "block",
                      marginTop: 8,
                    }}
                  >
                    View winners & history
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
                borderRadius: 12,
                background: "#3b82f6",
                border: "none",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
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
                  <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 14 }}>
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