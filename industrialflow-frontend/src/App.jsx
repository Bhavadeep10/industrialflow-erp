import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("industrialflow_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: "▦" },
  { key: "customers", label: "Customers", icon: "◉" },
  { key: "enquiries", label: "Enquiries", icon: "◇" },
  { key: "quotations", label: "Quotations", icon: "▤" },
  { key: "sales-orders", label: "Sales Orders", icon: "□" },
  { key: "inventory", label: "Inventory", icon: "▥" },
  { key: "dispatches", label: "Dispatches", icon: "→" },
];

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("industrialflow_token"),
  );

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("industrialflow_user");

    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("dashboard");

  const handleLogin = (loginData) => {
    localStorage.setItem(
      "industrialflow_token",
      loginData.token,
    );

    localStorage.setItem(
      "industrialflow_user",
      JSON.stringify(loginData.user),
    );

    setToken(loginData.token);
    setUser(loginData.user);
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("industrialflow_token");
    localStorage.removeItem("industrialflow_user");

    setToken(null);
    setUser(null);
    setPage("dashboard");
  };

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-area">
        <TopBar
          page={page}
          user={user}
        />

        <div className="page-content">
          {page === "dashboard" && (
            <Dashboard
              setPage={setPage}
              user={user}
            />
          )}

          {page === "customers" && (
            <Customers />
          )}

          {page === "enquiries" && (
            <Enquiries />
          )}

          {page === "quotations" && (
            <Quotations />
          )}

          {page === "sales-orders" && (
            <SalesOrders />
          )}

          {page === "inventory" && (
            <Inventory />
          )}

          {page === "dispatches" && (
            <Dispatches />
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}

/* =========================================================
   LOGIN
   ========================================================= */

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("sales@industrialflow.com");
  const [password, setPassword] = useState("Sales@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email,
          password,
        },
      );

      onLogin(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to the IndustrialFlow ERP server.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          IF
        </div>

        <h1 className="login-title">
          IndustrialFlow ERP
        </h1>

        <p className="login-subtitle">
          Industrial Sales & Inventory Management
        </p>

        <form
          className="login-form"
          onSubmit={login}
        >
          <div className="form-group">
            <label className="form-label">
              Email Address
            </label>

            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>

            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {error && (
            <div className="alert alert-error login-alert">
              {error}
            </div>
          )}
        </form>

        <div className="login-footer">
          Secure JWT Authentication
          <span> • </span>
          Role Based Access
          <br />
          <strong>Developed by Bhavadeep</strong>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function Sidebar({
  page,
  setPage,
  user,
  onLogout,
}) {
  return (
    <aside className="sidebar">

      <div className="logo-area">
        <div className="logo-box">
          IF
        </div>

        <div className="logo-text">
          <div className="logo-title">
            IndustrialFlow
          </div>

          <div className="logo-subtitle">
            ERP SYSTEM
          </div>
        </div>
      </div>

      <div className="sidebar-menu">

        <div className="menu-title">
          MAIN MENU
        </div>

        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`menu-item ${
              page === item.key ? "active" : ""
            }`}
            onClick={() => setPage(item.key)}
          >
            <span className="menu-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <div className="sidebar-user">

        <div className="user-avatar">
          {user.name
            ? user.name.charAt(0).toUpperCase()
            : "U"}
        </div>

        <div className="user-info">
          <div className="user-name">
            {user.name}
          </div>

          <div className="user-role">
            {user.role}
          </div>
        </div>

        <button
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   TOP BAR
   ========================================================= */

function TopBar({ page, user }) {
  const title =
    menuItems.find((item) => item.key === page)
      ?.label || "Dashboard";

  return (
    <header className="top-bar">

      <div>
        <div className="breadcrumb">
          IndustrialFlow ERP / {title}
        </div>

        <h1 className="page-title">
          {title}
        </h1>
      </div>

      <div className="top-user">
        <div className="top-avatar">
          {user.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <div className="top-user-name">
            {user.name}
          </div>

          <div className="top-user-role">
            {user.role}
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({ setPage, user }) {
  const [data, setData] = useState({
    customers: 0,
    enquiries: 0,
    quotations: 0,
    salesOrders: 0,
    products: 0,
    dispatches: 0,
    acceptedQuotations: 0,
    pendingOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [
        customers,
        enquiries,
        quotations,
        salesOrders,
        inventory,
        dispatches,
      ] = await Promise.all([
        api.get("/customers"),
        api.get("/enquiries"),
        api.get("/quotations"),
        api.get("/sales-orders"),
        api.get("/inventory"),
        api.get("/dispatches"),
      ]);

      const quotationList =
        quotations.data.quotations || [];

      const orderList =
        salesOrders.data.salesOrders || [];

      setData({
        customers:
          customers.data.customers?.length || 0,

        enquiries:
          enquiries.data.enquiries?.length || 0,

        quotations:
          quotationList.length,

        salesOrders:
          orderList.length,

        products:
          inventory.data.inventory?.length || 0,

        dispatches:
          dispatches.data.dispatches?.length || 0,

        acceptedQuotations:
          quotationList.filter(
            (q) => q.status === "ACCEPTED",
          ).length,

        pendingOrders:
          orderList.filter(
            (o) => o.status === "PENDING",
          ).length,
      });
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      label: "Customers",
      value: data.customers,
      icon: "◉",
      page: "customers",
    },
    {
      label: "Enquiries",
      value: data.enquiries,
      icon: "◇",
      page: "enquiries",
    },
    {
      label: "Quotations",
      value: data.quotations,
      icon: "▤",
      page: "quotations",
    },
    {
      label: "Sales Orders",
      value: data.salesOrders,
      icon: "□",
      page: "sales-orders",
    },
    {
      label: "Products",
      value: data.products,
      icon: "▥",
      page: "inventory",
    },
    {
      label: "Dispatches",
      value: data.dispatches,
      icon: "→",
      page: "dispatches",
    },
  ];

  return (
    <>
      <section className="dashboard-hero">

        <div className="hero-content">

          <div className="hero-label">
            INDUSTRIALFLOW ERP
          </div>

          <h2 className="hero-title">
            Welcome back,{" "}
            <span>
              {user.name}
            </span>
          </h2>

          <p className="hero-description">
            Manage enquiries, quotations, sales
            orders, inventory and dispatch
            operations from one place.
          </p>
        </div>

        <div className="hero-logo">
          IF
        </div>
      </section>

      <section className="stats-grid">

        {stats.map((stat) => (
          <button
            className="stat-card"
            key={stat.label}
            onClick={() => setPage(stat.page)}
          >
            <div className="stat-top">

              <div className="stat-icon">
                {stat.icon}
              </div>

              <div className="stat-label">
                {stat.label}
              </div>
            </div>

            <div className="stat-value">
              {loading ? "..." : stat.value}
            </div>

            <div className="stat-footer">
              <span>View</span>
              <span>→</span>
            </div>
          </button>
        ))}
      </section>

      <section className="dashboard-grid">

        <div className="card workflow-card">

          <div className="card-header">
            <div className="card-title">
              ERP Workflow
            </div>

            <div className="card-subtitle">
              Complete order processing flow
            </div>
          </div>

          <div className="workflow">

            {[
              ["01", "Enquiry", "Customer request"],
              ["02", "Quotation", "Price calculation"],
              ["03", "Sales Order", "Order confirmation"],
              ["04", "Reservation", "Stock allocation"],
              ["05", "Dispatch", "Shipment"],
            ].map((step, index) => (
              <div
                className="workflow-group"
                key={step[1]}
              >
                <div className="workflow-step">

                  <div className="workflow-number">
                    {step[0]}
                  </div>

                  <div className="workflow-name">
                    {step[1]}
                  </div>

                  <div className="workflow-description">
                    {step[2]}
                  </div>
                </div>

                {index < 4 && (
                  <div className="workflow-arrow">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">

          <div className="card-header">
            <div className="card-title">
              Quick Summary
            </div>

            <div className="card-subtitle">
              Current workflow status
            </div>
          </div>

          <div className="summary-list">

            <div className="summary-row">
              <span className="summary-label">
                Accepted Quotations
              </span>

              <span className="summary-value">
                {data.acceptedQuotations}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-label">
                Pending Orders
              </span>

              <span className="summary-value">
                {data.pendingOrders}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-label">
                Products
              </span>

              <span className="summary-value">
                {data.products}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-label">
                Dispatches
              </span>

              <span className="summary-value">
                {data.dispatches}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* =========================================================
   CUSTOMERS
   ========================================================= */

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    mobile: "",
    email: "",
    city: "",
  });

  const loadCustomers = async () => {
    try {
      const response =
        await api.get("/customers");

      setCustomers(
        response.data.customers || [],
      );
    } catch (error) {
      setMessage("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const createCustomer = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/customers", form);

      setMessage(
        "Customer created successfully.",
      );

      setForm({
        companyName: "",
        contactPerson: "",
        mobile: "",
        email: "",
        city: "",
      });

      loadCustomers();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create customer.",
      );
    }
  };

  return (
    <div className="page-grid">

      <div className="card form-card">

        <div className="card-header">
          <div className="card-title">
            Add Customer
          </div>

          <div className="card-subtitle">
            Create a new customer
          </div>
        </div>

        <form
          className="form"
          onSubmit={createCustomer}
        >
          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          <FormInput
            label="Company Name"
            value={form.companyName}
            onChange={(value) =>
              setForm({
                ...form,
                companyName: value,
              })
            }
            required
          />

          <FormInput
            label="Contact Person"
            value={form.contactPerson}
            onChange={(value) =>
              setForm({
                ...form,
                contactPerson: value,
              })
            }
            required
          />

          <FormInput
            label="Mobile"
            value={form.mobile}
            onChange={(value) =>
              setForm({
                ...form,
                mobile: value,
              })
            }
            required
          />

          <FormInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) =>
              setForm({
                ...form,
                email: value,
              })
            }
            required
          />

          <FormInput
            label="City"
            value={form.city}
            onChange={(value) =>
              setForm({
                ...form,
                city: value,
              })
            }
            required
          />

          <button
            className="btn btn-primary full-width"
            type="submit"
          >
            + Add Customer
          </button>
        </form>
      </div>

      <div className="card data-card">

        <div className="data-card-header">
          <div>
            <div className="data-card-title">
              Customers
            </div>

            <div className="data-card-count">
              {customers.length} customer(s)
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={loadCustomers}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <EmptyState message="No customers found." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>City</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="table-primary">
                        {customer.companyName}
                      </div>
                    </td>

                    <td>
                      {customer.contactPerson}
                    </td>

                    <td>
                      {customer.mobile}
                    </td>

                    <td>
                      {customer.email}
                    </td>

                    <td>
                      {customer.city}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ENQUIRIES
   ========================================================= */

function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    requiredDate: "",
    notes: "",
    productId: "",
    quantity: 1,
  });

  const loadData = async () => {
    try {
      const [
        enquiryResponse,
        customerResponse,
        inventoryResponse,
      ] = await Promise.all([
        api.get("/enquiries"),
        api.get("/customers"),
        api.get("/inventory"),
      ]);

      setEnquiries(
        enquiryResponse.data.enquiries || [],
      );

      setCustomers(
        customerResponse.data.customers || [],
      );

      setProducts(
        (inventoryResponse.data.inventory || []).map(
          (item) => item.product,
        ),
      );
    } catch (error) {
      setMessage(
        "Unable to load enquiry data.",
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createEnquiry = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/enquiries", {
        customerId: Number(form.customerId),
        requiredDate: form.requiredDate,
        notes: form.notes,
        items: [
          {
            productId: Number(form.productId),
            quantity: Number(form.quantity),
          },
        ],
      });

      setMessage(
        "Enquiry created successfully.",
      );

      setForm({
        customerId: "",
        requiredDate: "",
        notes: "",
        productId: "",
        quantity: 1,
      });

      loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create enquiry.",
      );
    }
  };

  return (
    <div className="page-grid">

      <div className="card form-card">

        <div className="card-header">
          <div className="card-title">
            New Enquiry
          </div>

          <div className="card-subtitle">
            Capture customer requirements
          </div>
        </div>

        <form
          className="form"
          onSubmit={createEnquiry}
        >
          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          <FormSelect
            label="Customer"
            value={form.customerId}
            onChange={(value) =>
              setForm({
                ...form,
                customerId: value,
              })
            }
            options={customers.map((customer) => ({
              value: customer.id,
              label: customer.companyName,
            }))}
            required
          />

          <FormInput
            label="Required Date"
            type="date"
            value={form.requiredDate}
            onChange={(value) =>
              setForm({
                ...form,
                requiredDate: value,
              })
            }
            required
          />

          <FormSelect
            label="Product"
            value={form.productId}
            onChange={(value) =>
              setForm({
                ...form,
                productId: value,
              })
            }
            options={products.map((product) => ({
              value: product.id,
              label: `${product.productCode} - ${product.productName}`,
            }))}
            required
          />

          <FormInput
            label="Quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={(value) =>
              setForm({
                ...form,
                quantity: value,
              })
            }
            required
          />

          <FormTextarea
            label="Notes"
            value={form.notes}
            onChange={(value) =>
              setForm({
                ...form,
                notes: value,
              })
            }
          />

          <button
            className="btn btn-primary full-width"
            type="submit"
          >
            + Create Enquiry
          </button>
        </form>
      </div>

      <div className="card data-card">

        <div className="data-card-header">
          <div>
            <div className="data-card-title">
              Enquiries
            </div>

            <div className="data-card-count">
              {enquiries.length} enquiry(s)
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={loadData}
          >
            ↻ Refresh
          </button>
        </div>

        {enquiries.length === 0 ? (
          <EmptyState message="No enquiries found." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Enquiry No.</th>
                  <th>Customer</th>
                  <th>Required Date</th>
                  <th>Items</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td>
                      <div className="table-primary">
                        {enquiry.enquiryNumber}
                      </div>
                    </td>

                    <td>
                      {enquiry.customer?.companyName}
                    </td>

                    <td>
                      {formatDate(
                        enquiry.requiredDate,
                      )}
                    </td>

                    <td>
                      {enquiry.items?.length || 0}
                    </td>

                    <td>
                      <StatusBadge
                        status={enquiry.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   QUOTATIONS
   ========================================================= */

function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    enquiryId: "",
    validUntil: "",
    unitPrice: "",
    discountPct: 0,
    gstPct: 18,
  });

  const selectedEnquiry = useMemo(() => {
    return enquiries.find(
      (item) =>
        item.id === Number(form.enquiryId),
    );
  }, [enquiries, form.enquiryId]);

  const loadData = async () => {
    try {
      const [
        quotationResponse,
        enquiryResponse,
      ] = await Promise.all([
        api.get("/quotations"),
        api.get("/enquiries"),
      ]);

      setQuotations(
        quotationResponse.data.quotations || [],
      );

      setEnquiries(
        enquiryResponse.data.enquiries || [],
      );
    } catch (error) {
      setMessage(
        "Unable to load quotation data.",
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createQuotation = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !selectedEnquiry ||
      !selectedEnquiry.items?.length
    ) {
      setMessage(
        "Select a valid enquiry with items.",
      );
      return;
    }

    try {
      const items =
        selectedEnquiry.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(
            form.unitPrice ||
              item.product?.basePrice ||
              0,
          ),
          discountPct: Number(
            form.discountPct,
          ),
          gstPct: Number(form.gstPct),
        }));

      await api.post("/quotations", {
        enquiryId: Number(form.enquiryId),
        validUntil: form.validUntil,
        items,
      });

      setMessage(
        "Quotation created successfully.",
      );

      setForm({
        enquiryId: "",
        validUntil: "",
        unitPrice: "",
        discountPct: 0,
        gstPct: 18,
      });

      loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create quotation.",
      );
    }
  };

  const updateStatus = async (
    quotationId,
    status,
  ) => {
    try {
      await api.patch(
        `/quotations/${quotationId}/status`,
        { status },
      );

      loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to update quotation.",
      );
    }
  };

  return (
    <div className="page-grid">

      <div className="card form-card">

        <div className="card-header">
          <div className="card-title">
            Create Quotation
          </div>

          <div className="card-subtitle">
            Generate pricing from an enquiry
          </div>
        </div>

        <form
          className="form"
          onSubmit={createQuotation}
        >
          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          <FormSelect
            label="Enquiry"
            value={form.enquiryId}
            onChange={(value) =>
              setForm({
                ...form,
                enquiryId: value,
              })
            }
            options={enquiries
              .filter(
                (enquiry) =>
                  enquiry.status === "NEW" ||
                  enquiry.status === "QUOTED",
              )
              .map((enquiry) => ({
                value: enquiry.id,
                label: `${enquiry.enquiryNumber} - ${enquiry.customer?.companyName}`,
              }))}
            required
          />

          {selectedEnquiry && (
            <div className="selected-info">
              <strong>
                Selected enquiry
              </strong>

              <div>
                {selectedEnquiry.items?.length || 0}{" "}
                product(s)
              </div>
            </div>
          )}

          <FormInput
            label="Valid Until"
            type="date"
            value={form.validUntil}
            onChange={(value) =>
              setForm({
                ...form,
                validUntil: value,
              })
            }
            required
          />

          <FormInput
            label="Unit Price"
            type="number"
            min="0"
            value={form.unitPrice}
            onChange={(value) =>
              setForm({
                ...form,
                unitPrice: value,
              })
            }
            placeholder="Leave empty to use base price"
          />

          <FormInput
            label="Discount %"
            type="number"
            min="0"
            max="100"
            value={form.discountPct}
            onChange={(value) =>
              setForm({
                ...form,
                discountPct: value,
              })
            }
          />

          <FormInput
            label="GST %"
            type="number"
            min="0"
            max="100"
            value={form.gstPct}
            onChange={(value) =>
              setForm({
                ...form,
                gstPct: value,
              })
            }
          />

          <button
            className="btn btn-primary full-width"
            type="submit"
          >
            + Create Quotation
          </button>
        </form>
      </div>

      <div className="card data-card">

        <div className="data-card-header">
          <div>
            <div className="data-card-title">
              Quotations
            </div>

            <div className="data-card-count">
              {quotations.length} quotation(s)
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={loadData}
          >
            ↻ Refresh
          </button>
        </div>

        {quotations.length === 0 ? (
          <EmptyState message="No quotations found." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td>
                      <div className="table-primary">
                        {quotation.quotationNumber}
                      </div>
                    </td>

                    <td>
                      {quotation.customer?.companyName}
                    </td>

                    <td>
                      ₹
                      {formatMoney(
                        quotation.grandTotal,
                      )}
                    </td>

                    <td>
                      {formatDate(
                        quotation.validUntil,
                      )}
                    </td>

                    <td>
                      <StatusBadge
                        status={quotation.status}
                      />
                    </td>

                    <td>
                      <div className="action-group">

                        {quotation.status ===
                          "DRAFT" && (
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() =>
                              updateStatus(
                                quotation.id,
                                "ACCEPTED",
                              )
                            }
                          >
                            Accept
                          </button>
                        )}

                        {quotation.status ===
                          "DRAFT" && (
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() =>
                              updateStatus(
                                quotation.id,
                                "REJECTED",
                              )
                            }
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SALES ORDERS
   ========================================================= */

function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [message, setMessage] = useState("");
  const [quotationId, setQuotationId] = useState("");

  const loadData = async () => {
    try {
      const [orderResponse, quotationResponse] =
        await Promise.all([
          api.get("/sales-orders"),
          api.get("/quotations"),
        ]);

      setOrders(orderResponse.data.salesOrders || []);
      setQuotations(quotationResponse.data.quotations || []);
    } catch (error) {
      setMessage("Unable to load sales order data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(
        `/sales-orders/${orderId}/status`,
        { status },
      );

      setMessage(`Sales order updated to ${status}.`);
      loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to update sales order.",
      );
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!quotationId) {
      setMessage("Select an accepted quotation.");
      return;
    }

    try {
      await api.post("/sales-orders", {
        quotationId: Number(quotationId),
      });

      setMessage("Sales order created successfully.");
      setQuotationId("");
      loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create sales order.",
      );
    }
  };

  const reserveOrder = async (
    orderId,
    setMessage,
    reload,
  ) => {
    try {
      const response = await api.post("/inventory/reserve", {
        salesOrderId: Number(orderId),
      });

      setMessage(
        response.data.message ||
          "Inventory reserved successfully.",
      );
      reload();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to reserve inventory.",
      );
    }
  };

  const orderQuotationIds = new Set(
    orders.map((order) => order.quotationId),
  );

  const availableQuotations = quotations.filter(
    (quotation) =>
      quotation.status === "ACCEPTED" &&
      !orderQuotationIds.has(quotation.id),
  );

  return (
    <div className="page-grid">
      <div className="card form-card">
        <div className="card-header">
          <div className="card-title">
            Create Sales Order
          </div>

          <div className="card-subtitle">
            Convert an accepted quotation into a sales order
          </div>
        </div>

        <form className="form" onSubmit={createOrder}>
          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          <FormSelect
            label="Accepted Quotation"
            value={quotationId}
            onChange={setQuotationId}
            options={availableQuotations.map((quotation) => ({
              value: quotation.id,
              label: `${quotation.quotationNumber} - ${quotation.customer?.companyName} - ₹${formatMoney(quotation.grandTotal)}`,
            }))}
            required
          />

          {availableQuotations.length === 0 && (
            <div className="selected-info">
              No unused accepted quotations are available.
            </div>
          )}

          <button
            className="btn btn-primary full-width"
            type="submit"
            disabled={availableQuotations.length === 0}
          >
            + Create Sales Order
          </button>
        </form>
      </div>

      <div className="card data-card">
        <div className="data-card-header">
          <div>
            <div className="data-card-title">
              Sales Orders
            </div>

            <div className="data-card-count">
              {orders.length} order(s)
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={loadData}
          >
            ↻ Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <EmptyState message="No sales orders found." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Quotation</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="table-primary">
                        {order.orderNumber}
                      </div>
                    </td>

                    <td>
                      {order.customer?.companyName}
                    </td>

                    <td>
                      {order.quotation?.quotationNumber}
                    </td>

                    <td>
                      ₹{formatMoney(order.totalAmount)}
                    </td>

                    <td>
                      <StatusBadge status={order.status} />
                    </td>

                    <td>
                      <div className="action-group">
                        {order.status === "PENDING" && (
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() =>
                              updateStatus(order.id, "CONFIRMED")
                            }
                          >
                            Confirm
                          </button>
                        )}

                        {order.status === "PENDING" && (
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() =>
                              updateStatus(order.id, "CANCELLED")
                            }
                          >
                            Cancel
                          </button>
                        )}

                        {order.status === "CONFIRMED" && (
                          <button
                            className="btn btn-small btn-success"
                            onClick={() =>
                              reserveOrder(
                                order.id,
                                setMessage,
                                loadData,
                              )
                            }
                          >
                            Reserve Stock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card info-card">
        <div className="info-card-content">
          <strong>Sales Order Workflow</strong>

          <span>
            Accepted Quotation → Sales Order → Confirm →
            Reserve Inventory → Dispatch
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INVENTORY
   ========================================================= */

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState("");

  const loadInventory = async () => {
    try {
      const response =
        await api.get("/inventory");

      setInventory(
        response.data.inventory || [],
      );
    } catch (error) {
      setMessage(
        "Unable to load inventory.",
      );
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <div className="single-column">

      {message && (
        <div className="alert alert-info">
          {message}
        </div>
      )}

      <div className="inventory-toolbar">
        <div>
          <h2>
            Inventory Availability
          </h2>

          <p>
            Physical stock, reserved stock and
            available quantity
          </p>
        </div>

        <button
          className="btn btn-outline"
          onClick={loadInventory}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="inventory-grid">

        {inventory.map((item) => (
          <div
            className="inventory-card"
            key={item.id}
          >
            <div className="inventory-name">
              {item.product?.productName}
            </div>

            <div className="inventory-code">
              {item.product?.productCode}
            </div>

            <div className="inventory-category">
              {item.product?.category}
            </div>

            <div className="inventory-values">

              <div className="inventory-value">
                <div className="inventory-value-label">
                  Physical
                </div>

                <div className="inventory-value-number">
                  {item.physicalQuantity}
                </div>
              </div>

              <div className="inventory-value">
                <div className="inventory-value-label">
                  Reserved
                </div>

                <div className="inventory-value-number">
                  {item.reservedQuantity}
                </div>
              </div>

              <div className="inventory-value available">
                <div className="inventory-value-label">
                  Available
                </div>

                <div className="inventory-value-number">
                  {item.availableQuantity}
                </div>
              </div>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

/* =========================================================
   DISPATCHES
   ========================================================= */

function Dispatches() {
  const [dispatches, setDispatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    salesOrderId: "",
    vehicleNumber: "",
    driverName: "",
  });

  const loadData = async () => {
    try {
      const [
        dispatchResponse,
        orderResponse,
      ] = await Promise.all([
        api.get("/dispatches"),
        api.get("/sales-orders"),
      ]);

      setDispatches(
        dispatchResponse.data.dispatches || [],
      );

      setOrders(
        orderResponse.data.salesOrders || [],
      );
    } catch (error) {
      setMessage(
        "Unable to load dispatch data.",
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedOrder = orders.find(
    (order) =>
      order.id === Number(form.salesOrderId),
  );

  const createDispatch = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedOrder) {
      setMessage(
        "Select a confirmed sales order.",
      );
      return;
    }

    try {
      await api.post("/dispatches", {
        salesOrderId: Number(
          form.salesOrderId,
        ),
        vehicleNumber:
          form.vehicleNumber,
        driverName:
          form.driverName,
        items:
          selectedOrder.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
      });

      setMessage(
        "Dispatch created successfully.",
      );

      setForm({
        salesOrderId: "",
        vehicleNumber: "",
        driverName: "",
      });

      loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create dispatch.",
      );
    }
  };

  return (
    <div className="page-grid">

      <div className="card form-card">

        <div className="card-header">
          <div className="card-title">
            Create Dispatch
          </div>

          <div className="card-subtitle">
            Dispatch reserved sales order items
          </div>
        </div>

        <form
          className="form"
          onSubmit={createDispatch}
        >
          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          <FormSelect
            label="Sales Order"
            value={form.salesOrderId}
            onChange={(value) =>
              setForm({
                ...form,
                salesOrderId: value,
              })
            }
            options={orders
              .filter(
                (order) =>
                  order.status ===
                  "CONFIRMED",
              )
              .map((order) => ({
                value: order.id,
                label: `${order.orderNumber} - ${order.customer?.companyName}`,
              }))}
            required
          />

          {selectedOrder && (
            <div className="selected-info">
              <strong>
                Order Items
              </strong>

              {selectedOrder.items?.map(
                (item) => (
                  <div
                    key={item.id}
                    className="selected-item"
                  >
                    {item.product?.productName}
                    {" — "}
                    {item.quantity}
                  </div>
                ),
              )}
            </div>
          )}

          <FormInput
            label="Vehicle Number"
            value={form.vehicleNumber}
            onChange={(value) =>
              setForm({
                ...form,
                vehicleNumber: value,
              })
            }
            placeholder="KA01AB1234"
            required
          />

          <FormInput
            label="Driver Name"
            value={form.driverName}
            onChange={(value) =>
              setForm({
                ...form,
                driverName: value,
              })
            }
            required
          />

          <button
            className="btn btn-primary full-width"
            type="submit"
          >
            → Create Dispatch
          </button>
        </form>
      </div>

      <div className="card data-card">

        <div className="data-card-header">
          <div>
            <div className="data-card-title">
              Dispatch History
            </div>

            <div className="data-card-count">
              {dispatches.length} dispatch(es)
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={loadData}
          >
            ↻ Refresh
          </button>
        </div>

        {dispatches.length === 0 ? (
          <EmptyState message="No dispatches found." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dispatch</th>
                  <th>Sales Order</th>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Items</th>
                </tr>
              </thead>

              <tbody>
                {dispatches.map((dispatch) => (
                  <tr key={dispatch.id}>
                    <td>
                      <div className="table-primary">
                        {dispatch.dispatchNumber}
                      </div>
                    </td>

                    <td>
                      SO-
                      {dispatch.salesOrderId}
                    </td>

                    <td>
                      {formatDate(
                        dispatch.dispatchDate,
                      )}
                    </td>

                    <td>
                      {dispatch.vehicleNumber}
                    </td>

                    <td>
                      {dispatch.driverName}
                    </td>

                    <td>
                      {dispatch.items?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   FORM COMPONENTS
   ========================================================= */

function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
      </label>

      <input
        className="form-control"
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
      </label>

      <select
        className="form-control"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={required}
      >
        <option value="">
          Select {label}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
      </label>

      <textarea
        className="form-control textarea"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function StatusBadge({ status }) {
  const className =
    `status status-${String(status)
      .toLowerCase()
      .replaceAll("_", "-")}`;

  return (
    <span className={className}>
      {status}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        ◇
      </div>

      <div className="empty-state-title">
        Nothing here yet
      </div>

      <div>
        {message}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      IndustrialFlow ERP
      <span> • </span>
      <strong>Developed by Bhavadeep</strong>
    </footer>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function reserveOrder(
  salesOrderId,
  setMessage,
  loadOrders,
) {
  try {
    const response = await api.post(
      "/inventory/reserve",
      {
        salesOrderId,
      },
    );

    setMessage(
      response.data.message ||
        "Inventory reserved successfully.",
    );

    await loadOrders();
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
        "Unable to reserve inventory.",
    );
  }
}

export default App;