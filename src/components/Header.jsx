import "../App.css";

const ESIC_LOGO = "/esic-logo.png";
const INDIA_EMBLEM = "/emblem-of-india.png";

function Header() {
  return (
    <header className="header">
      <div className="esic-logo">
        <img
          className="esic-logo-image"
          src={ESIC_LOGO}
          alt="Employees' State Insurance Corporation"
        />

        <div className="logo-text">
          <div className="hindi-title">कर्मचारी राज्य बीमा निगम</div>

          <div className="english-title">
            Employees’ State Insurance Corporation
          </div>

          <div className="ministry">
            Ministry of Labour &amp; Employment, Government of India
          </div>
        </div>
      </div>

      <div className="government-mark">
        <div className="government-text">
          <div className="gov-hindi">পশ্চিমবঙ্গ সরকার</div>

          <div className="gov-english">Government of West Bengal</div>
        </div>

        <img
          className="india-emblem"
          src={INDIA_EMBLEM}
          alt="State Emblem of India"
        />
      </div>
    </header>
  );
}

export default Header;
