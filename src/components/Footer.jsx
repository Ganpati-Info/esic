import { FiPhone, FiDownload } from "react-icons/fi";

import { FaGooglePlay, FaApple, FaWindows } from "react-icons/fa";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-contact">
            <div className="footer-contact-item">
              <FiPhone size={15} />

              <div>
                <div>Toll Free / Help Desk</div>

                <strong>1800-11-2526</strong>
              </div>
            </div>

            <div className="footer-contact-item">
              <FiPhone size={15} />

              <div>
                <div>Medical Helpline</div>

                <strong>1800-11-3839</strong>
              </div>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-link-group">
              <div className="footer-heading">Quick Link</div>

              <button type="button">Web Information Manager</button>

              <button type="button">Website Policy</button>

              <button type="button">Copyright Policy</button>

              <button type="button">Sitemap</button>

              <button type="button">Feedback</button>
            </div>

            <div className="footer-link-group footer-secondary-links">
              <button type="button">Terms &amp; Conditions</button>

              <button type="button">Hyperlink Policy</button>

              <button type="button">Help</button>

              <button type="button">Disclaimer</button>
            </div>
          </div>
        </div>

        <div className="footer-apps">
          <div className="download-app">
            <div className="download-icon">
              <FiDownload size={27} />
            </div>

            <div>
              <div className="download-title">Download Umang App</div>

              <div className="app-icons">
                <FaGooglePlay />
                <FaApple />
                <FaWindows />
              </div>
            </div>
          </div>
        </div>

        <div className="footer-right">
          <div className="partner-logos">
            <div className="partner-logo">श्रम एवं रोजगार मंत्रालय</div>

            <div className="partner-logo">Government of India</div>

            <div className="partner-logo">
              World Health
              <br />
              Organization
            </div>

            <div className="partner-logo">NIC</div>

            <div className="partner-logo">india.gov.in</div>

            <div className="partner-logo">National Career Service</div>
          </div>

          <div className="footer-bottom">
            <div className="visitor-count">
              <span>6</span>
              <span>8</span>
              <span>6</span>
              <span>4</span>
              <span>4</span>
              <span>1</span>
              <span>3</span>
              <span>7</span>
              <span>9</span>
            </div>

            <div className="copyright">© Copyright 2025, ESIC.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
