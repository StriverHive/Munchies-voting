// client/src/pages/EmailTestPage.jsx
import React, { useState } from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Space,
  message,
} from "antd";
import axios from "axios";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const EmailTestPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSend = async (values) => {
    try {
      setLoading(true);
      const payload = {};

      if (values.toEmail && values.toEmail.trim()) {
        payload.to = values.toEmail.trim();
      }

      const response = await axios.post(
        "http://localhost:5000/api/test-email/send",
        payload
      );

      message.success(
        response.data?.message ||
          "Test email sent successfully."
      );
    } catch (error) {
      console.error("Test email error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send test email.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <Card
      style={{
        maxWidth: 500,
        margin: "0 auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Space
        direction="vertical"
        style={{ width: "100%" }}
        size="large"
      >
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            Test Email Sender
          </Title>
          <Text type="secondary">
            Send a test email using your current SMTP
            configuration to confirm everything works.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSend}
          initialValues={{
            toEmail: "",
          }}
        >
          <Form.Item
            label="Recipient email (optional)"
            name="toEmail"
            tooltip="If left empty, the server will use TEST_EMAIL_TO or EMAIL_USER from .env."
          >
            <Input
              placeholder="example@domain.com (leave empty to use default from .env)"
              prefix={<MailOutlined />}
              type="email"
            />
          </Form.Item>

          <Form.Item>
            <Space
              style={{
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
              >
                Back to Dashboard
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Send Test Email
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: 12 }}>
          The email will be sent from the address configured in
          your backend <code>.env</code> file. If you don&apos;t
          receive it, check your spam folder or SMTP
          configuration.
        </Text>
      </Space>
    </Card>
  );
};

export default EmailTestPage;
