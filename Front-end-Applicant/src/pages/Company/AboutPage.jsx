import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import aboutOfficeImg from '../../assets/about-office.jpg';
import aboutShipImg from '../../assets/about-ship.jpg';
import './Central.css';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="central-page about-page-shell">
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
            <Link to="/about" className="active-nav-link">ABOUT</Link>
            <Link to="/services">SERVICES</Link>
            <Link to="/contact">CONTACT</Link>
            <Link to="/apply" className="central-apply-btn">APPLY HERE</Link>
          </nav>
        </div>
      </header>

      <main className="about-page-main">
        <div className="about-page-container">
          <div className="about-hero-title">
            <h1>ABOUT US</h1>
            <p>6R Diamond International Cargo Logistics Inc.</p>
          </div>

          <section className="about-grid-row">
            <div className="about-copy">
              <p>
                As the demand for freight servicing increases, this one stop shop continues to move forward in developing up-to-date
                strategies and mechanisms to accomodate the needs of our clients while upholding our commitment of providing cost-efficient
                and quality service. Above all, the company&apos;s integrity is of utmost importance.
              </p>
            </div>
            <div className="about-photo">
              <img src={aboutOfficeImg} alt="6R Diamond office reception" />
            </div>
          </section>

          <section className="about-grid-row reverse">
            <div className="about-photo">
              <img src={aboutShipImg} alt="Aerial view of container ship at port" />
            </div>
            <div className="about-copy">
              <h2>OUR HISTORY</h2>
              <p>
                With more than four decades of experience in providing customs clearance and brokerage services, the founding president and CEO
                emerita of the company, Cresenciana Cruz, formally established 6R Diamond International Cargo Logistics, Inc. on January 7, 2007.
                Through this expansion, the company evolved from a simple customs brokerage to a freight forwarding company that offers a wide range
                of transportation and logistic services for importing and exporting customers both domestically and internationally.
              </p>
            </div>
          </section>

          <section className="about-pillar-grid">
            <article className="about-pillar">
              <div className="pillar-mark" aria-hidden="true">|||</div>
              <h3>OUR MISSION</h3>
              <p>
                Our company&apos;s top priority is to cater to the evolving needs of our customers by delivering quality and cost-efficient logistics
                and transportation solutions. We commit to ensure the total satisfaction of our clients by continuously improving our productivity
                through technological advancements and strategic innovations.
              </p>
            </article>

            <article className="about-pillar">
              <div className="pillar-mark" aria-hidden="true">/\\</div>
              <h3>OUR VISION</h3>
              <p>
                With the combined efforts of our motivated and experienced professionals, our vision is to be one of the leading providers of Logistics,
                Non-Vessel Operating Common Carrier, Trading and Consultancy Services recognized internationally. Moreover, our company envisions itself
                as a catalyst of social and economic change in the trade industry through freight forwarding.
              </p>
            </article>

            <article className="about-pillar">
              <h3>Professionalism</h3>
              <p>
                Our company consists of highly trained and well-experienced professionals in the field of logistics, freight forwarding, and customs brokerage.
              </p>
            </article>

            <article className="about-pillar">
              <h3>Partnership</h3>
              <p>
                Putting premium in aligning with prestigious and reputable players in the industry, 6R DIAMOND INT&apos;L CARGO LOGISTICS INC. time and resources
                were invested in the careful selection of domestic and international partners.
              </p>
            </article>
          </section>
        </div>
      </main>

      <section id="contact" className="footer-cta-bar">
        <div className="central-container cta-split">
          <div className="cta-message">
            <h3>Let us know how we can be of help. We will be glad to serve you.</h3>
            <p>See how we can help you move forward.</p>
          </div>
          <Link to="/contact" className="contact-yellow-btn">
            Contact Us <span className="arrow">-&gt;</span>
          </Link>
        </div>
      </section>

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

export default AboutPage;
