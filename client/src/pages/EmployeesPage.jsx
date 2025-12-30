// client/src/pages/EmployeesPage.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Modal,
  Tabs,
  Row,
  Col,
  Statistic,
  Divider,
  Empty,
  Upload,
  Alert,
  Badge,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;
const { Dragger } = Upload;

const API_BASE = "http://localhost:5000/api";

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // CSV bulk create
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Batch update CSV
  const [batchCsvFile, setBatchCsvFile] = useState(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Edit modal
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [updatingEmployee, setUpdatingEmployee] = useState(false);

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const res = await axios.get(`${API_BASE}/locations`);
      setLocations(res.data.locations || []);
    } catch (error) {
      console.error("Fetch locations error:", error);
      const msg = error.response?.data?.message || "Failed to load locations";
      message.error(msg);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchEmployees = async (
    page = currentPage,
    pageSizeValue = pageSize,
    searchValue = searchTerm
  ) => {
    try {
      setLoadingEmployees(true);
      const params = {
        page,
        pageSize: pageSizeValue,
      };
      const trimmedSearch =
        typeof searchValue === "string" ? searchValue.trim() : "";
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }

      const res = await axios.get(`${API_BASE}/employees`, { params });
      const data = res.data || {};
      setEmployees(data.employees || []);
      setCurrentPage(data.page || page);
      setPageSize(data.pageSize || pageSizeValue);
      setTotalEmployees(
        typeof data.total === "number"
          ? data.total
          : (data.employees || []).length
      );
    } catch (error) {
      console.error("Fetch employees error:", error);
      const msg = error.response?.data?.message || "Failed to load employees";
      message.error(msg);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchEmployees(1, pageSize, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goBack = () => {
    navigate("/dashboard");
  };

  const openCreateModal = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
  };

  const openBulkModal = () => {
    setCsvFile(null);
    setBulkModalVisible(true);
  };

  const closeBulkModal = () => {
    setBulkModalVisible(false);
  };

  const openBatchModal = () => {
    setBatchCsvFile(null);
    setBatchModalVisible(true);
  };

  const closeBatchModal = () => {
    setBatchModalVisible(false);
  };

  const handleCreateEmployee = async (values) => {
    try {
      setSavingEmployee(true);
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        employeeId: values.employeeId,
        locationIds: values.locationIds || [],
      };
      const res = await axios.post(`${API_BASE}/employees`, payload);
      message.success(res.data.message || "Employee created successfully");
      form.resetFields();
      closeCreateModal();
      fetchEmployees(currentPage, pageSize, searchTerm);
    } catch (error) {
      console.error("Create employee error:", error);
      const msg = error.response?.data?.message || "Failed to create employee";
      message.error(msg);
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    Modal.confirm({
      title: "Delete Employee",
      content: `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/employees/${employee._id}`);
          message.success("Employee deleted successfully");
          fetchEmployees(currentPage, pageSize, searchTerm);
        } catch (error) {
          console.error("Delete employee error:", error);
          const msg =
            error.response?.data?.message || "Failed to delete employee";
          message.error(msg);
        }
      },
    });
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    editForm.setFieldsValue({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      employeeId: employee.employeeId,
      locationIds: employee.locations?.map((loc) => loc._id) || [],
    });
  };

  const closeEditModal = () => {
    setEditingEmployee(null);
    editForm.resetFields();
  };

  const handleUpdateEmployee = async (values) => {
    if (!editingEmployee) return;
    try {
      setUpdatingEmployee(true);
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        employeeId: values.employeeId,
        locationIds: values.locationIds || [],
      };
      const res = await axios.put(
        `${API_BASE}/employees/${editingEmployee._id}`,
        payload
      );
      message.success(res.data.message || "Employee updated successfully");
      closeEditModal();
      fetchEmployees(currentPage, pageSize, searchTerm);
    } catch (error) {
      console.error("Update employee error:", error);
      const msg = error.response?.data?.message || "Failed to update employee";
      message.error(msg);
    } finally {
      setUpdatingEmployee(false);
    }
  };

  const handleCsvFileChange = (e) => {
    if (!e.target.files || !e.target.files.length) {
      setCsvFile(null);
      return;
    }
    const file = e.target.files[0];
    setCsvFile(file);
  };

  const handleBulkUpload = async () => {
    if (!csvFile) {
      message.error("Please select a CSV file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", csvFile);
    try {
      setUploading(true);
      const res = await axios.post(
        `${API_BASE}/employees/bulk-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      message.success(res.data.message || "Bulk upload successful");
      if (res.data.failed && res.data.failed > 0) {
        console.warn("Bulk upload errors:", res.data.errors);
        message.warning(
          `${res.data.failed} rows could not be imported. Check server logs for details.`
        );
      }
      setCsvFile(null);
      closeBulkModal();
      fetchEmployees(currentPage, pageSize, searchTerm);
    } catch (error) {
      console.error("Bulk upload error:", error);
      const msg = error.response?.data?.message || "Failed to upload CSV";
      message.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleBatchCsvFileChange = (e) => {
    if (!e.target.files || !e.target.files.length) {
      setBatchCsvFile(null);
      return;
    }
    const file = e.target.files[0];
    setBatchCsvFile(file);
  };

  const handleDownloadEmployeesCsv = async () => {
    try {
      setExportingCsv(true);
      const res = await axios.get(`${API_BASE}/employees/export-csv`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "");
      link.download = `employees-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("CSV downloaded successfully");
    } catch (error) {
      console.error("Export CSV error:", error);
      const msg = error.response?.data?.message || "Failed to download CSV";
      message.error(msg);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleBatchUpdateUpload = async () => {
    if (!batchCsvFile) {
      message.error("Please select a CSV file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", batchCsvFile);
    try {
      setBatchProcessing(true);
      const res = await axios.post(
        `${API_BASE}/employees/batch-update`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const data = res.data || {};
      message.success(data.message || "Batch update processed successfully");
      if (data.failed && data.failed > 0) {
        console.warn("Batch update errors:", data.errors);
        message.warning(
          `${data.failed} rows had issues. Check server logs for details.`
        );
      }
      setBatchCsvFile(null);
      closeBatchModal();
      fetchEmployees(currentPage, pageSize, searchTerm);
    } catch (error) {
      console.error("Batch update error:", error);
      const msg =
        error.response?.data?.message || "Failed to process batch update";
      message.error(msg);
    } finally {
      setBatchProcessing(false);
    }
  };

  const columns = [
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      width: 140,
      render: (text) => (
        <Text strong style={{ color: "#1890ff" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Name",
      key: "name",
      width: 200,
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: "#8c8c8c" }} />
          <Text>{`${record.firstName || ""} ${record.lastName || ""}`}</Text>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value) => <Text type="secondary">{value || "-"}</Text>,
    },
    {
      title: "Locations",
      key: "locations",
      render: (_, record) =>
        record.locations && record.locations.length > 0 ? (
          <Space wrap>
            {record.locations.map((loc) => (
              <Tag
                key={loc._id}
                icon={<EnvironmentOutlined />}
                color="blue"
              >
                {loc.name} ({loc.code})
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteEmployee(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const loadingAny = loadingEmployees || loadingLocations;

  const handleTableChange = (pagination) => {
    const { current, pageSize: newPageSize } = pagination;
    fetchEmployees(current, newPageSize, searchTerm);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value === "") {
      fetchEmployees(1, pageSize, "");
    }
  };

  const handleSearch = (value) => {
    const trimmed = value.trim();
    setSearchTerm(trimmed);
    fetchEmployees(1, pageSize, trimmed);
  };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header Section */}
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={0}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={goBack}
                style={{ padding: 0, height: "auto", marginBottom: 8 }}
              >
                Back to Dashboard
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                <TeamOutlined style={{ marginRight: 12, color: "#1890ff" }} />
                Employee Management
              </Title>
              <Text type="secondary">
                Manage your workforce efficiently with powerful tools
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              <Button
                type="default"
                icon={<UploadOutlined />}
                onClick={openBulkModal}
                size="large"
              >
                Bulk Import
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={openBatchModal}
                size="large"
              >
                Batch Update
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                size="large"
              >
                Add Employee
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Total Employees"
              value={totalEmployees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Active Locations"
              value={locations.length}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Current Page"
              value={currentPage}
              suffix={`/ ${Math.ceil(totalEmployees / pageSize)}`}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
      >
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search by name, email, or employee ID"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={handleSearchInputChange}
            onSearch={handleSearch}
            style={{ width: 400 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={employees}
          loading={loadingAny}
          rowKey="_id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalEmployees,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} employees`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                description="No employees found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Create Employee Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: "#1890ff" }} />
            <span>Add New Employee</span>
          </Space>
        }
        open={createModalVisible}
        onCancel={closeCreateModal}
        onOk={() => form.submit()}
        confirmLoading={savingEmployee}
        okText="Add Employee"
        width={600}
      >
        <Divider style={{ margin: "16px 0" }} />
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateEmployee}
          requiredMark="optional"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[
                  { required: true, message: "Please enter first name" },
                ]}
              >
                <Input placeholder="Enter first name" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input placeholder="Enter last name" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="employee@company.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Employee ID"
            name="employeeId"
            rules={[{ required: true, message: "Please enter employee ID" }]}
          >
            <Input placeholder="Enter unique employee ID" size="large" />
          </Form.Item>

          <Form.Item label="Assigned Locations" name="locationIds">
            <Select
              mode="multiple"
              placeholder="Select locations"
              size="large"
              loading={loadingLocations}
              showSearch
              optionFilterProp="children"
            >
              {locations.map((loc) => (
                <Option key={loc._id} value={loc._id}>
                  {loc.name} ({loc.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        title={
          <Space>
            <UploadOutlined style={{ color: "#1890ff" }} />
            <span>Bulk Import Employees</span>
          </Space>
        }
        open={bulkModalVisible}
        onCancel={closeBulkModal}
        footer={[
          <Button key="cancel" onClick={closeBulkModal}>
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleBulkUpload}
            loading={uploading}
            disabled={!csvFile}
          >
            Upload CSV
          </Button>,
        ]}
        width={700}
      >
        <Divider style={{ margin: "16px 0" }} />
        
        <Alert
          message="CSV Format Requirements"
          description={
            <div>
              <p>Your CSV file must include the following headers:</p>
              <Text code>firstName,lastName,email,employeeId,locationCodes</Text>
              <p style={{ marginTop: 8 }}>
                <strong>locationCodes</strong> should be store codes separated by
                comma or semicolon (e.g., <Text code>DON;SHF</Text>)
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Dragger
          accept=".csv"
          maxCount={1}
          beforeUpload={() => false}
          onChange={(info) => {
            if (info.fileList.length > 0) {
              setCsvFile(info.fileList[0].originFileObj);
            } else {
              setCsvFile(null);
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ color: "#1890ff" }} />
          </p>
          <p className="ant-upload-text">
            Click or drag CSV file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for a single CSV file upload. Make sure your file follows
            the required format.
          </p>
        </Dragger>

        {csvFile && (
          <Alert
            message={`File selected: ${csvFile.name}`}
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>

      {/* Batch Update Modal */}
      <Modal
        title={
          <Space>
            <DownloadOutlined style={{ color: "#1890ff" }} />
            <span>Batch Update Employees</span>
          </Space>
        }
        open={batchModalVisible}
        onCancel={closeBatchModal}
        footer={null}
        width={800}
      >
        <Divider style={{ margin: "16px 0" }} />
        
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <DownloadOutlined />
                Download CSV
              </span>
            }
            key="1"
          >
            <Alert
              message="Export Current Employees"
              description="Download all employees in CSV format. You can edit this file in Excel and upload it back in the Update tab."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownloadEmployeesCsv}
              loading={exportingCsv}
              block
            >
              Download Employees CSV
            </Button>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UploadOutlined />
                Update CSV
              </span>
            }
            key="2"
          >
            <Alert
              message="Update Instructions"
              description={
                <div>
                  <p>Upload a CSV with the same format as the downloaded file:</p>
                  <Text code>
                    employeeId,firstName,lastName,email,locationCodes
                  </Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>
                      Existing employees (matched by <strong>employeeId</strong>)
                      will be updated
                    </li>
                    <li>New employee IDs will create new employees</li>
                  </ul>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Dragger
              accept=".csv"
              maxCount={1}
              beforeUpload={() => false}
              onChange={(info) => {
                if (info.fileList.length > 0) {
                  setBatchCsvFile(info.fileList[0].originFileObj);
                } else {
                  setBatchCsvFile(null);
                }
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: "#fa8c16" }} />
              </p>
              <p className="ant-upload-text">
                Click or drag updated CSV file here
              </p>
              <p className="ant-upload-hint">
                Upload your edited CSV file to process batch updates
              </p>
            </Dragger>

            {batchCsvFile && (
              <Alert
                message={`File selected: ${batchCsvFile.name}`}
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            <Button
              type="primary"
              size="large"
              icon={<UploadOutlined />}
              onClick={handleBatchUpdateUpload}
              loading={batchProcessing}
              disabled={!batchCsvFile}
              block
              style={{ marginTop: 16 }}
            >
              Process Updates
            </Button>
          </TabPane>
        </Tabs>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: "#1890ff" }} />
            <span>Edit Employee</span>
          </Space>
        }
        open={!!editingEmployee}
        onCancel={closeEditModal}
        onOk={() => editForm.submit()}
        confirmLoading={updatingEmployee}
        okText="Save Changes"
        width={600}
      >
        <Divider style={{ margin: "16px 0" }} />
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateEmployee}
          requiredMark="optional"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[
                  { required: true, message: "Please enter first name" },
                ]}
              >
                <Input placeholder="Enter first name" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input placeholder="Enter last name" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="employee@company.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Employee ID"
            name="employeeId"
            rules={[{ required: true, message: "Please enter employee ID" }]}
          >
            <Input placeholder="Enter unique employee ID" size="large" />
          </Form.Item>

          <Form.Item label="Assigned Locations" name="locationIds">
            <Select
              mode="multiple"
              placeholder="Select locations"
              size="large"
              loading={loadingLocations}
              showSearch
              optionFilterProp="children"
            >
              {locations.map((loc) => (
                <Option key={loc._id} value={loc._id}>
                  {loc.name} ({loc.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;