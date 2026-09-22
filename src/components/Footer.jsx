import { FiPhone } from "react-icons/fi";

const INDIA_EMBLEM = "/emblem-of-india.png";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-block">
          <img
            className="india-emblem"
            src={INDIA_EMBLEM}
            alt="State Emblem of India"
          />

          <div className="footer-brand-copy">
            <div className="footer-brand-tag">Government of West Bengal</div>

            <div className="footer-brand-title">Labour Department</div>

            <div className="footer-brand-subtitle">
              ESI(MB) Grievance Redressal Portal
            </div>
          </div>
        </div>

        <div className="footer-links-group">
          <div className="footer-heading">Quick Links</div>

          <button type="button">Web Information Manager</button>

          <button type="button">Website Policy</button>

          <button type="button">Copyright Policy</button>

          <button type="button">Sitemap</button>

          <button type="button">Feedback</button>
        </div>

        <div className="footer-support-block">
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
        </div>

        <div className="footer-right">
          <div className="partner-logos">
            <div className="partner-logo">Labour &amp; Employment</div>

            <div className="partner-logo">MyGov</div>

            <div className="partner-logo">Digital India</div>

            <div className="partner-logo">NIC</div>

            <div className="partner-logo">india.gov.in</div>

            <div className="partner-logo">Citizen Services</div>
          </div>

          <div className="footer-bottom">
            <div className="copyright">© Copyright 2026, ESI(MB).</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
