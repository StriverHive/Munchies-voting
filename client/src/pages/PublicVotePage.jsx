// client/src/pages/PublicVotePage.jsx
import React, { useState } from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Checkbox,
  Space,
  Alert,
} from "antd";
import axios from "axios";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../config/api";

const { Title, Text } = Typography;
const { Group: CheckboxGroup } = Checkbox;

const PublicVotePage = () => {
  const { voteId } = useParams();

  const [step, setStep] = useState("enterEmployeeId"); // 'enterEmployeeId' | 'voting' | 'done'
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [voteData, setVoteData] = useState(null);
  const [voter, setVoter] = useState(null);
  const [selectedNomineeIds, setSelectedNomineeIds] = useState([]);

  const [form] = Form.useForm();
  const [errorText, setErrorText] = useState(null); // ONLY inline error panel

  const handleCheckEmployee = async (values) => {
    try {
      setChecking(true);
      setErrorText(null);

      const res = await axios.post(
        `${API_BASE_URL}/votes/${voteId}/check-employee`,
        {
          employeeId: values.employeeId,
        }
      );

      setVoteData(res.data.vote);
      setVoter(res.data.voter);
      setSelectedNomineeIds([]);
      setStep("voting");
      // No toast, the UI changing to voting page is enough feedback
    } catch (error) {
      console.error("Check employee error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Unable to verify your employee ID. Please try again.";

      // ONLY inline panel
      setErrorText(errorMessage);
    } finally {
      setChecking(false);
    }
  };

  const handleNomineeChange = (values) => {
    if (!voteData) {
      setSelectedNomineeIds(values);
      return;
    }

    const max = voteData.maxVotesPerVoter || 1;
    if (values.length > max) {
      const msg = `You can select up to ${max} nominee${
        max > 1 ? "s" : ""
      } only`;
      // Show as inline error
      setErrorText(msg);
      return;
    }

    // Clear old error if user is now within limit
    if (errorText) {
      setErrorText(null);
    }

    setSelectedNomineeIds(values);
  };

  const handleSubmitVote = async () => {
    if (!voteData || !voter) {
      const msg =
        "Voting session is not ready. Please refresh the page and try again.";
      setErrorText(msg);
      return;
    }

    if (!selectedNomineeIds || selectedNomineeIds.length === 0) {
      const msg = "Please select at least one nominee";
      setErrorText(msg);
      return;
    }

    try {
      setSubmitting(true);
      setErrorText(null);

      await axios.post(
        `${API_BASE_URL}/votes/${voteId}/cast`,
        {
          employeeId: voter.employeeId,
          nomineeIds: selectedNomineeIds,
        }
      );

      // No toast, just go to Thank You page
      setStep("done");
    } catch (error) {
      console.error("Cast vote error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit your vote. Please try again.";
      setErrorText(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderEnterEmployeeId = () => (
    <>
      <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
        Employee Voting
      </Title>
      <Text
        type="secondary"
        style={{ display: "block", textAlign: "center", marginBottom: 16 }}
      >
        Please enter your Employee ID to continue.
      </Text>

      {errorText && (
        <Alert
          type="error"
          message={errorText}
          showIcon
          closable
          onClose={() => setErrorText(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" form={form} onFinish={handleCheckEmployee}>
        <Form.Item
          label="Employee ID"
          name="employeeId"
          rules={[
            { required: true, message: "Please enter your employee ID" },
            { min: 2, message: "Employee ID must be at least 2 characters" },
          ]}
        >
          <Input placeholder="e.g. EMP-001" />
        </Form.Item>

        <Form.Item style={{ marginTop: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={checking}
          >
            Continue
          </Button>
        </Form.Item>
      </Form>
    </>
  );

  const renderVoting = () => {
    if (!voteData || !voter) return null;

    const max = voteData.maxVotesPerVoter || 1;

    return (
      <>
        <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
          {voteData.name}
        </Title>

        <Text
          style={{ display: "block", textAlign: "center", marginBottom: 8 }}
        >
          Hello{" "}
          <strong>
            {voter.firstName} {voter.lastName}
          </strong>{" "}
          (ID: {voter.employeeId})
        </Text>

        <Text
          type="secondary"
          style={{ display: "block", textAlign: "center", marginBottom: 16 }}
        >
          You can select up to {max} nominee{max > 1 ? "s" : ""}.
        </Text>

        {errorText && (
          <Alert
            type="error"
            message={errorText}
            showIcon
            closable
            onClose={() => setErrorText(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ marginBottom: 12 }}>
          <Text strong>Nominees:</Text>
        </div>

        <CheckboxGroup
          value={selectedNomineeIds}
          onChange={handleNomineeChange}
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {voteData.nominees.map((nominee) => (
              <Checkbox
                key={nominee._id}
                value={nominee._id}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 4,
                  border: "1px solid #f0f0f0",
                }}
              >
                {nominee.firstName} {nominee.lastName} (
                {nominee.employeeId})
              </Checkbox>
            ))}
          </Space>
        </CheckboxGroup>

        <Button
          type="primary"
          block
          style={{ marginTop: 24 }}
          onClick={handleSubmitVote}
          loading={submitting}
        >
          Submit Vote
        </Button>
      </>
    );
  };

  const renderDone = () => (
    <>
      <Title level={3} style={{ textAlign: "center", marginBottom: 16 }}>
        Thank You!
      </Title>
      <Text
        type="secondary"
        style={{ display: "block", textAlign: "center", marginBottom: 16 }}
      >
        Your vote has been submitted successfully. You cannot vote again
        in this poll.
      </Text>
    </>
  );

  return (
    <Card
      style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
      bodyStyle={{ padding: 16 }}
    >
      {step === "enterEmployeeId" && renderEnterEmployeeId()}
      {step === "voting" && renderVoting()}
      {step === "done" && renderDone()}
    </Card>
  );
};

export default PublicVotePage;
