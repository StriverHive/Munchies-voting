// client/src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, message, Space, Divider, Progress } from "antd";
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  UserAddOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 30) return "#ef4444";
    if (strength < 60) return "#f59e0b";
    if (strength < 80) return "#3b82f6";
    return "#10b981";
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength < 30) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    return "Strong";
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        values
      );
      message.success(response.data.message || "Registration successful!");
      
      // Navigate to login after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
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
          width: 500,
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
            <UserAddOutlined style={{ fontSize: 36, color: "white" }} />
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
            Create Account
          </Title>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: 15,
              display: "block",
            }}
          >
            Join our voting platform today
          </Text>
        </div>

        {/* Form Section */}
        <div style={{ padding: "32px 40px 40px" }}>
          {/* Benefits Section */}
          <div
            style={{
              marginBottom: 24,
              padding: "16px 20px",
              background: "#f0f9ff",
              borderRadius: 8,
              border: "1px solid #bae6fd",
            }}
          >
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space>
                <CheckCircleOutlined style={{ color: "#0284c7", fontSize: 16 }} />
                <Text style={{ fontSize: 13, color: "#0369a1" }}>
                  Secure and encrypted authentication
                </Text>
              </Space>
              <Space>
                <CheckCircleOutlined style={{ color: "#0284c7", fontSize: 16 }} />
                <Text style={{ fontSize: 13, color: "#0369a1" }}>
                  Access to democratic voting system
                </Text>
              </Space>
            </Space>
          </div>

          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item
              label={
                <Text strong style={{ fontSize: 14, color: "#374151" }}>
                  Username
                </Text>
              }
              name="username"
              rules={[
                { required: true, message: "Please enter your username" },
                { min: 3, message: "Username must be at least 3 characters" },
                { 
                  pattern: /^[a-zA-Z0-9_]+$/, 
                  message: "Username can only contain letters, numbers, and underscores" 
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
                placeholder="Choose a username"
                autoComplete="username"
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
                { required: true, message: "Please enter a password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
                placeholder="Create a strong password"
                autoComplete="new-password"
                size="large"
                onChange={handlePasswordChange}
                style={{
                  borderRadius: 8,
                  fontSize: 15,
                }}
              />
            </Form.Item>

            {/* Password Strength Indicator */}
            {passwordStrength > 0 && (
              <div style={{ marginTop: -16, marginBottom: 16 }}>
                <Progress
                  percent={passwordStrength}
                  strokeColor={getPasswordStrengthColor(passwordStrength)}
                  showInfo={false}
                  size="small"
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: getPasswordStrengthColor(passwordStrength),
                  }}
                >
                  Password strength: {getPasswordStrengthLabel(passwordStrength)}
                </Text>
              </div>
            )}

            {/* Terms and Conditions */}
            <div
              style={{
                marginBottom: 20,
                padding: 12,
                background: "#fef3c7",
                borderRadius: 8,
                border: "1px solid #fde68a",
              }}
            >
              <Space align="start">
                <SafetyCertificateOutlined style={{ color: "#d97706", fontSize: 16, marginTop: 2 }} />
                <Text style={{ fontSize: 12, color: "#92400e" }}>
                  By registering, you agree to our Terms of Service and Privacy Policy. 
                  Your data is encrypted and secure.
                </Text>
              </Space>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<UserAddOutlined />}
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
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: "24px 0" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              OR
            </Text>
          </Divider>

          {/* Login Section */}
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
                Already have an account?
              </Text>
              <Button
                type="link"
                onClick={goToLogin}
                style={{
                  color: "#667eea",
                  fontWeight: 600,
                  padding: 0,
                  height: "auto",
                }}
              >
                Sign in instead →
              </Button>
            </Space>
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

export default RegisterPage;