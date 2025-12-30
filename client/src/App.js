// client/src/App.js
import React, { useEffect, useState } from "react";
import {
  Layout,
  Typography,
  Menu,
  Dropdown,
  Avatar,
} from "antd";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LocationsPage from "./pages/LocationsPage";
import EmployeesPage from "./pages/EmployeesPage";
import VotingManagementPage from "./pages/VotingManagementPage";
import VotingReportPage from "./pages/VotingReportPage";
import WinnersPage from "./pages/WinnersPage";
import WinnersHistoryPage from "./pages/WinnersHistoryPage";
import OfficialWinnersPage from "./pages/OfficialWinnersPage";
import PublicVotePage from "./pages/PublicVotePage";
import EmailTestPage from "./pages/EmailTestPage";
import InviteVotePage from "./pages/InviteVotePage";
import AllVotesPage from "./pages/AllVotesPage";

import {
  DashboardOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

/* ===========================
   PUBLIC LAYOUT
   (login, register, public vote)
   =========================== */

const PublicShell = ({ children, maxWidth = 480 }) => (
  <Layout
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#f5f7fa",
    }}
  >
    <Header
      style={{
        background: "#001529",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Title
        level={4}
        style={{
          color: "#fff",
          margin: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Voting System
      </Title>
    </Header>

    <Content
      style={{
        padding: "24px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
        }}
      >
        {children}
      </div>
    </Content>

    <Footer
      style={{
        textAlign: "center",
        padding: "12px 8px",
        fontSize: 12,
        background: "#ffffff",
      }}
    >
      Voting System © {new Date().getFullYear()}
    </Footer>
  </Layout>
);

/* ===========================
   AUTHENTICATED LAYOUT
   (sidebar + aligned header)
   =========================== */

const AuthedShell = ({ children, selectedKey, user, onLogout }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/locations",
      icon: <EnvironmentOutlined />,
      label: "Locations",
    },
    {
      key: "/employees",
      icon: <TeamOutlined />,
      label: "Employees",
    },
    {
      key: "/voting",
      icon: <BarChartOutlined />,
      label: "Voting",
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key) navigate(key);
  };

  const userInitial =
    (user?.username && user.username.charAt(0)) ||
    (user?.email && user.email.charAt(0)) ||
    "U";

  const profileMenuItems = [
    {
      key: "info",
      disabled: true,
      label: (
        <div style={{ padding: "4px 8px" }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              marginBottom: 2,
            }}
          >
            {user?.username || "User"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            {user?.email}
          </div>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Logout",
    },
  ];

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
      }}
    >
      {/* SIDEBAR */}
      <Sider
        width={230}
        breakpoint="lg"
        collapsedWidth={70}
        style={{
          background: "#ffffff",
          borderRight: "1px solid #f0f0f0",
        }}
      >
        {/* Munchies logo at top of sidebar */}
          {/* Munchies logo at top of sidebar */}
  <div
    style={{
      height: 90, // was 64
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderBottom: "1px solid #f0f0f0",
    }}
  >
    <div
      style={{
        width: 200,          // was 40
        height: 100,          // was 40
        borderRadius: 25,    // a bit rounder
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        cursor: "pointer",
      }}
      onClick={() => navigate("/dashboard")}
    >
      <img
        src="/munchies-logo.png"
        alt="Munchies Voting App"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  </div>


        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            borderRight: 0,
            paddingTop: 8,
          }}
        />
      </Sider>

      {/* RIGHT SIDE */}
      <Layout
        style={{
          background: "#f5f7fa",
        }}
      >
        {/* HEADER */}
        <Header
          style={{
            background: "#f5f7fa",
            padding: 0,
            borderBottom: "1px solid #e5e7eb",
            lineHeight: "normal",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Left side: title + subtitle */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Voting System
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: "#2c1a3cff",
                }}
              >
                Manage locations, employees and voting sessions
              </span>
            </div>

            {/* Right side: avatar with dropdown menu */}
            {user && (
              <Dropdown
                trigger={["click"]}
                placement="bottomRight"
                menu={{
                  items: profileMenuItems,
                  onClick: ({ key }) => {
                    if (key === "logout" && onLogout) {
                      onLogout();
                    }
                  },
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "4px 6px",
                    borderRadius: 999,
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e5f2ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Avatar
                    style={{
                      background: "#1d4ed8",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                    size={32}
                  >
                    {userInitial}
                  </Avatar>
                </div>
              </Dropdown>
            )}
          </div>
        </Header>

        {/* CONTENT */}
        <Content
          style={{
            padding: "16px 0 0",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "16px 24px 24px",
            }}
          >
            {children}
          </div>
        </Content>

        <Footer
          style={{
            textAlign: "center",
            padding: "12px 8px",
            fontSize: 12,
            background: "#ffffff",
          }}
        >
          Voting System © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

/* ===========================
   ROOT APP
   =========================== */

function App() {
  const [auth, setAuth] = useState({
    token: null,
    user: null,
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAuth({
          token: storedToken,
          user: parsedUser,
        });
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLoginSuccess = ({ token, user }) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(user));
    setAuth({ token, user });
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setAuth({ token: null, user: null });
  };

  const renderAuthedPage = (Component, selectedKey, extraProps = {}) => (
    <AuthedShell
      selectedKey={selectedKey}
      user={auth.user}
      onLogout={handleLogout}
    >
      <Component {...extraProps} user={auth.user} onLogout={handleLogout} />
    </AuthedShell>
  );

  // 🔹 Prevent redirects until we've loaded auth from localStorage
  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#4b5563",
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route
          path="/"
          element={
            auth.user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public auth pages */}
        <Route
          path="/register"
          element={
            <PublicShell>
              <RegisterPage />
            </PublicShell>
          }
        />
        <Route
          path="/login"
          element={
            auth.user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <PublicShell>
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              </PublicShell>
            )
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            auth.user ? (
              renderAuthedPage(DashboardPage, "/dashboard")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Locations */}
        <Route
          path="/locations"
          element={
            auth.user ? (
              renderAuthedPage(LocationsPage, "/locations")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Employees */}
        <Route
          path="/employees"
          element={
            auth.user ? (
              renderAuthedPage(EmployeesPage, "/employees")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Voting management */}
        <Route
          path="/voting"
          element={
            auth.user ? (
              renderAuthedPage(VotingManagementPage, "/voting")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* All votes history (new page) */}
        <Route
          path="/voting/all-votes"
          element={
            auth.user ? (
              renderAuthedPage(AllVotesPage, "/voting")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Voting report */}
        <Route
          path="/voting/:voteId/report"
          element={
            auth.user ? (
              renderAuthedPage(VotingReportPage, "/voting")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Winners (grouped under Voting in sidebar) */}
        <Route
          path="/winners"
          element={
            auth.user ? (
              renderAuthedPage(WinnersPage, "/voting")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/winners/history"
          element={
            auth.user ? (
              renderAuthedPage(WinnersHistoryPage, "/voting")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/winners/:voteId/official"
          element={
            auth.user ? (
              renderAuthedPage(OfficialWinnersPage, "/voting")
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Hidden email test page – still accessible by URL, not in sidebar */}
        <Route
          path="/test-email"
          element={
            auth.user ? (
              renderAuthedPage(EmailTestPage, null)
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Public voting pages */}
        <Route
          path="/vote/:voteId"
          element={
            <PublicShell maxWidth={800}>
              <PublicVotePage />
            </PublicShell>
          }
        />
        <Route
          path="/vote/:voteId/invite/:token"
          element={
            <PublicShell maxWidth={800}>
              <InviteVotePage />
            </PublicShell>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
