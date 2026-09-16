import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiSearch,
  FiMessageCircle,
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
} from "react-icons/fi";

const USERS = [
  {
    userId: "esic_superadmin",
    password: "ESIC@SuperAdmin2026",
    role: "admin",
  },
  {
    userId: "esic_officer",
    password: "ESIC@Officer2026",
    role: "officer",
  },
  {
    userId: "esic_joka",
    password: "ESIC@Joka2026",
    role: "hospital",
    hospitalName: "Joka Hospital",
  },
  {
    userId: "esic_maniktala",
    password: "ESIC@Maniktala2026",
    role: "hospital",
    hospitalName: "Maniktala Hospital",
  },
  {
    userId: "esic_kamarhati",
    password: "ESIC@Kamarhati2026",
    role: "hospital",
    hospitalName: "Kamarhati Hospital",
  },
];

function Feature({ icon: Icon, title, description }) {
  return (
    <div className="feature">
      <div className="feature-icon">
        <Icon size={32} strokeWidth={2} />
      </div>

      <div className="feature-title">{title}</div>

      <div className="feature-description">{description}</div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    setError("");

    const authenticatedUser = USERS.find(
      (user) => user.userId === userId.trim() && user.password === password,
    );

    if (authenticatedUser) {
      sessionStorage.setItem(
        "esicUser",
        JSON.stringify({
          userId: authenticatedUser.userId,
          role: authenticatedUser.role,
          hospitalName: authenticatedUser.hospitalName || "",
        }),
      );
      navigate("/hospital/dashboard");
      return;
    }

    setError("Invalid User ID or password. Please check your credentials.");
  };

  return (
    <main className="main">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-line" />

          <h1>
            ESIC <span>Grievance</span> Portal
          </h1>

          <p className="hero-description">
            A transparent and responsive platform to raise, track
            <br />
            and resolve your grievances.
          </p>

          <div className="features">
            <Feature
              icon={FiFileText}
              title={
                <>
                  Raise
                  <br />
                  Grievance
                </>
              }
              description={
                <>
                  Submit your concern
                  <br />
                  easily
                </>
              }
            />

            <Feature
              icon={FiSearch}
              title="Track Status"
              description={
                <>
                  Stay updated in
                  <br />
                  real-time
                </>
              }
            />

            <Feature
              icon={FiMessageCircle}
              title="Get Resolution"
              description={
                <>
                  Faster and more
                  <br />
                  efficient support
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="login-section">
        <div className="login-card">
          <div className="login-heading">
            <h2>Welcome Back</h2>

            <p>Login to ESIC Grievance Portal</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>
                User ID
                <span>*</span>
              </label>

              <div className="input-wrapper">
                <div className="input-icon">
                  <FiUser size={21} />
                </div>

                <input
                  type="text"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Enter your User ID or Insurance Number"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Password
                <span>*</span>
              </label>

              <div className="input-wrapper">
                <div className="input-icon">
                  <FiLock size={21} />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <div className="login-options">
              <button
                type="button"
                className="remember"
                onClick={() => setRemember((value) => !value)}
              >
                <span className={remember ? "checkbox checked" : "checkbox"}>
                  {remember && <FiCheck size={14} />}
                </span>

                <span>Remember me</span>
              </button>

              <button type="button" className="forgot">
                Forgot Password?
              </button>
            </div>

            <button className="login-button" type="submit">
              Login
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
