// client/src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, message, Space, Divider } from "antd";
import { MailOutlined, LockOutlined, LoginOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const LoginPage = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        values
      );

      const { token, user, message: successMessage } = response.data;

      if (!token || !user) {
        message.error("Invalid login response from server.");
        return;
      }

      message.success(successMessage || "Login successful!");

      // Inform parent (App) about successful login
      onLoginSuccess({ token, user });

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate("/register");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          filter: "blur(80px)",
        }}
      />

      <Card
        style={{
          width: 480,
          maxWidth: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRadius: 20,
          border: "none",
          background: "white",
          position: "relative",
          zIndex: 1,
        }}
        bodyStyle={{
          padding: 0,
        }}
      >
        {/* Header Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "40px 40px 32px",
            borderRadius: "20px 20px 0 0",
            textAlign: "center",
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <UserOutlined style={{ fontSize: 36, color: "white" }} />
          </div>

          <Title
            level={2}
            style={{
              color: "white",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 28,
            }}
          >
            Welcome Back
          </Title>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: 15,
              display: "block",
            }}
          >
            Sign in to access your voting dashboard
          </Text>
        </div>

        {/* Form Section */}
        <div style={{ padding: "32px 40px 40px" }}>
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item
              label={
                <Text strong style={{ fontSize: 14, color: "#374151" }}>
                  Email Address
                </Text>
              }
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#9ca3af" }} />}
                placeholder="you@example.com"
                autoComplete="email"
                size="large"
                style={{
                  borderRadius: 8,
                  fontSize: 15,
                }}
              />
            </Form.Item>

            <Form.Item
              label={
                <Text strong style={{ fontSize: 14, color: "#374151" }}>
                  Password
                </Text>
              }
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
                placeholder="Enter your password"
                autoComplete="current-password"
                size="large"
                style={{
                  borderRadius: 8,
                  fontSize: 15,
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LoginOutlined />}
                block
                loading={loading}
                size="large"
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: "24px 0" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              OR
            </Text>
          </Divider>

          {/* Register Section */}
          <div
            style={{
              textAlign: "center",
              padding: "16px 20px",
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <Space direction="vertical" size={4}>
              <Text style={{ color: "#6b7280", fontSize: 14 }}>
                Don't have an account?
              </Text>
              <Button
                type="link"
                onClick={goToRegister}
                style={{
                  color: "#667eea",
                  fontWeight: 600,
                  padding: 0,
                  height: "auto",
                }}
              >
                Create a new account →
              </Button>
            </Space>
          </div>

          {/* Additional Info */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                color: "#9ca3af",
                display: "block",
              }}
            >
              Secure login powered by advanced encryption
            </Text>
          </div>
        </div>
      </Card>

      {/* Decorative Elements */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          zIndex: 0,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.3)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoginPage;