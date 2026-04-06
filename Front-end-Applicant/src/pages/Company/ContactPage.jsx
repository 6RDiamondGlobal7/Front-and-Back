import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './Central.css';
import './ContactPage.css';

const ContactPage = () => {
  return (
    <div className="central-page contact-page-shell">
      <header className="central-header">
        <div className="central-header-container">
          <div className="central-logo">
            <img
              src={logoImg}
              alt="GRI Diamond International Cargo Logistics, Inc."
              className="logo-image"
            />
          </div>

          <nav className="central-nav">
            <Link to="/">HOME</Link>
            <Link to="/about">ABOUT</Link>
            <Link to="/services">SERVICES</Link>
            <Link to="/contact" className="active-nav-link">CONTACT</Link>
            <Link to="/apply" className="central-apply-btn">APPLY HERE</Link>
          </nav>
        </div>
      </header>

      <main className="contact-main">
        <section className="contact-details-section">
          <div className="contact-details-inner">
            <h1>Contact Us</h1>
            <p className="contact-lead">
              For inquiries about freight forwarding, transportation, and brokerage services,
              please reach us through the details below.
            </p>

            <div className="contact-cards">
              <article className="contact-card">
                <h2>Office Hours</h2>
                <p>8:00 AM - 5:00 PM</p>
                <p>Monday to Friday</p>
              </article>

              <article className="contact-card">
                <h2>Office Address</h2>
                <p>6R Diamond International Cargo Logistics Inc.</p>
                <p>RM 212 Burke Bldg., Burke St. cor. Escolta</p>
                <p>Binondo, Manila NCR 1006, Philippines</p>
              </article>

              <article className="contact-card">
                <h2>Phone</h2>
                <p>+632 87428084</p>
                <p>+632 87413121</p>
              </article>

              <article className="contact-card">
                <h2>Email</h2>
                <p>info@6r-diamond.com</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="central-footer">
        <div className="footer-main-container">
          <div className="footer-columns">
            <div className="footer-column">
              <h4 className="footer-heading">6R DIAMOND INTERNATIONAL CARGO LOGISTICS INC. - ABOUT US</h4>
              <p className="footer-text">
                We are here to serve all customers and overseas partners with the highest degree of integrity,
                efficiency, and professionalism. We offer a complete range of logistics service via all modes of transport.
              </p>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">CONTACT US</h4>
              <div className="footer-contact-details">
                <p>Contact Us:</p>
                <div className="contact-item">
                  <svg className="contact-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <p>info@6r-diamond.com</p>
                </div>
                <div className="contact-item">
                  <svg className="contact-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <p>+632 87428084 • +632 87413121</p>
                </div>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">SITEMAP</h4>
              <ul className="footer-nav-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/services">Services</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-copyright-strip">
          <p>Copyright © 6R Diamond International Cargo Logistics Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
