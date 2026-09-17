import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiCheck,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiLock,
  FiMessageCircle,
  FiSearch,
  FiUser,
} from "react-icons/fi";

import { loginToWordPress, getCurrentUser } from "../lib/auth";

function Feature({ icon: Icon, title, description }) {
  return (
    <div className="feature">
      <div className="feature-icon">
        <Icon size={22} />
      </div>

      <div className="feature-content">
        <h3>{title}</h3>

        <p>{description}</p>
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!userId.trim() || !password) {
      setError("Please enter your User ID and password.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Step 1
       * Authenticate with WordPress.
       */
      const token = await loginToWordPress(userId.trim(), password);

      /*
       * Step 2
       * Get the authenticated WordPress user.
       */
      const user = await getCurrentUser(token);

      /*
       * Step 3
       * Get the first WordPress role.
       */
      const role = user.roles?.nodes?.[0];

      /*
       * Step 4
       * Store the authenticated session.
       */
      sessionStorage.setItem("esicToken", token);

      sessionStorage.setItem(
        "esicUser",
        JSON.stringify({
          userId: user.username,
          userDatabaseId: user.databaseId,
          name: user.name,
          role: role?.name || "",
          roleDisplayName: role?.displayName || "",
        }),
      );

      /*
       * Step 5
       * Redirect to the hospital dashboard.
       *
       * Proper role guards will be added later.
       */
      navigate("/hospital/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("Login error:", error);

      setError(error?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      {/* HERO */}

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

      {/* LOGIN */}

      <section className="login-section">
        <div className="login-card">
          <div className="login-heading">
            <h2>Welcome Back</h2>

            <p>Login to ESIC Grievance Portal</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {/* USER ID */}

            <div className="form-group">
              <label htmlFor="userId">
                User ID
                <span>*</span>
              </label>

              <div className="input-wrapper">
                <div className="input-icon">
                  <FiUser size={21} />
                </div>

                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Enter your User ID or Insurance Number"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="form-group">
              <label htmlFor="password">
                Password
                <span>*</span>
              </label>

              <div className="input-wrapper">
                <div className="input-icon">
                  <FiLock size={21} />
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* OPTIONS */}

            <div className="login-options">
              <button
                type="button"
                className="remember"
                onClick={() => setRemember((value) => !value)}
                disabled={loading}
              >
                <span className={remember ? "checkbox checked" : "checkbox"}>
                  {remember && <FiCheck size={14} />}
                </span>

                <span>Remember me</span>
              </button>

              <button type="button" className="forgot" disabled={loading}>
                Forgot Password?
              </button>
            </div>

            {/* SUBMIT */}

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
