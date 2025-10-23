import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaFacebook, FaInstagram, FaYoutube, FaEnvelope, FaPhone } from "react-icons/fa";
import "./Footer.css";
import YGALogo from "./images/YGALogo.png";

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleScroll = (hash) => {
    if (location.pathname !== "/landingpage") {
      navigate(`/landingpage${hash}`);
    } else {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src={YGALogo} alt="YGA Logo" />
        </div>
        <div className="footer-links">
          <div className="footer-section">
            <h4>Quick Links</h4>
            <p onClick={() => handleScroll("#home")}>Home</p>
            <p onClick={() => handleScroll("#about")}>About</p>
            <p onClick={() => handleScroll("#books")}>Books</p>
          </div>
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>
              <FaEnvelope style={{ marginRight: "8px" }} />
              whlopez0209@gmail.com
            </p>
            <p>
              <FaPhone style={{ marginRight: "8px" }} />
              0949-360-0349
            </p>
          </div>
          <div className="footer-section">
            <h4>Social</h4>
            <div className="social-icons">
              <a href="https://www.facebook.com/YoungGenerationAcademy" target="_blank" rel="noreferrer">
                <FaFacebook />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        ©2025 Young Generation Academy of Caloocan, Inc | All Rights Reserved
      </div>
    </footer>
  );
}

export default Footer;
