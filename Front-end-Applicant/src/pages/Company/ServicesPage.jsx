import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import serviceSeaImg from '../../assets/services-sea.jpeg';
import serviceAirImg from '../../assets/services-air.jpeg';
import serviceCustomsImg from '../../assets/services-customs.jpeg';
import serviceInlandImg from '../../assets/services-inland.jpeg';
import serviceOtherImg from '../../assets/services-other.jpeg';
import servicesTruckIcon from '../../assets/services-truck-icon.png';
import servicesBusinessIcon from '../../assets/services-business-icon.png';
import './Central.css';
import './ServicesPage.css';

const ServicesPage = () => {
  return (
    <div className="central-page services-page-shell">
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
            <Link to="/services" className="active-nav-link">SERVICES</Link>
            <Link to="/contact">CONTACT</Link>
            <Link to="/apply" className="central-apply-btn">APPLY HERE</Link>
          </nav>
        </div>
      </header>

      <main className="services-main">
        <section className="services-hero">
          <div className="services-hero-overlay">
            <h1>Our Services</h1>
            <p>See our list of available professional services for logistics</p>
          </div>
        </section>

        <section className="services-blue-panel">
          <div className="services-blue-inner">
            <div>
              <h2>BUSINESS SOLUTIONS</h2>
              <div className="line"></div>
              <img src={servicesBusinessIcon} alt="Business solutions icon" className="business-solutions-icon" />
            </div>
            <p>
              The services offered by 6R Diamond International Cargo Logistics, Inc. are designed to accomodate the individual
              needs of our clients and partners. The versatility of what the company is offering allows our client to negotiate
              and customize our service in accordance to their desired outcome by considering the optimal cost for both parties.
              The company offers a complete range of import and export logistic services via multimodal transportation for
              commercial and personal cargoes.
            </p>
          </div>
        </section>

        <section className="services-card-grid">
          <article className="service-card">
            <img src={serviceSeaImg} alt="Sea freight" />
            <div className="service-card-body">
              <h3>Sea Freight Forwarding</h3>
              <p>Being a Non-Vessel Operating Common Carrier (NVOCC), 6R Diamond offers quality and comprehensive sea freight services.</p>
            </div>
          </article>
          <article className="service-card">
            <img src={serviceAirImg} alt="Air freight" />
            <div className="service-card-body">
              <h3>Air Freight Forwarding</h3>
              <p>6R Diamond upholds fast, reliable, and cost-efficient air freight forwarding for importing and exporting clients.</p>
            </div>
          </article>
          <article className="service-card">
            <img src={serviceCustomsImg} alt="Customs brokerage" />
            <div className="service-card-body">
              <h3>Customs Clearance and Brokerage</h3>
              <p>With more than 40 years of experience, our team coordinates and processes requirements for import and export.</p>
            </div>
          </article>
          <article className="service-card">
            <img src={serviceInlandImg} alt="Inland transportation" />
            <div className="service-card-body">
              <h3>Inland Transportation</h3>
              <p>We provide quality trucking services with trained professional drivers for safe and efficient cargo delivery.</p>
            </div>
          </article>
        </section>

        <section className="other-services">
          <div>
            <h3>Other Services</h3>
            <ul>
              <li>Non Vessel Operation Common Carrier (NVOCC)</li>
              <li>International Air and Sea Freight Forwarding</li>
              <li>Domestic Air and Sea Freight Forwarding</li>
              <li>Inland Transportation</li>
              <li>Breakbulk Agent</li>
              <li>Customs Clearance/Brokerage</li>
              <li>Packing/Crating</li>
              <li>Haulage/Heavy Lift Equipments</li>
              <li>Logistics &amp; Warehousing</li>
            </ul>
          </div>
          <img src={serviceOtherImg} alt="Other services" />
        </section>

        <section className="delivery-equipment-section">
          <div className="delivery-equipment-wrap">
            <div className="delivery-left">
              <h3>OUR DELIVERY EQUIPMENT</h3>
              <img src={servicesTruckIcon} alt="Delivery truck icon" className="delivery-truck-icon" />
            </div>
            <div className="delivery-grid">
              <div className="delivery-item">
                <span className="delivery-circle">3</span>
                <p>40-Footer Trailer Truck</p>
              </div>
              <div className="delivery-item">
                <span className="delivery-circle">6</span>
                <p>20-Footer Trailer Truck</p>
              </div>
              <div className="delivery-item">
                <span className="delivery-circle">7</span>
                <p>Tractor Head</p>
              </div>
              <div className="delivery-item">
                <span className="delivery-circle">2</span>
                <p>4-Wheeler Delivery van</p>
              </div>
            </div>
          </div>
        </section>
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

export default ServicesPage;

