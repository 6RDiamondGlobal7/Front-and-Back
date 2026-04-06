import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import heroImage from '../../assets/cargo.jpg';
import aboutOfficeImg from '../../assets/about-office.jpg';
import aboutHistoryImg from '../../assets/about-history-ship.jpg';
import servicesOtherImg from '../../assets/services-other.jpeg';
import servicesTruckIcon from '../../assets/services-truck-icon.png';
import './Central.css';

const Central = ({ initialSection = 'home' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAboutPage = location.pathname === '/about';
  const [activeSection, setActiveSection] = useState(initialSection);
  // Add a ref to track if we are currently performing a manual click-scroll
  const isManualScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      // If we clicked a link, don't let the scroll listener change the active section
      if (isManualScrolling.current) return;

      const sections = ['home', 'about', 'services', 'contact'];
      const scrollPosition = window.scrollY + 200;

      const isBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60;

      if (isBottom) {
        setActiveSection('contact');
      } else {
        sections.forEach((sectionId) => {
          const element = document.getElementById(sectionId);
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveSection(sectionId);
            }
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!isAboutPage) return;
    setActiveSection('about');
  }, [isAboutPage]);

  // Helper function to handle nav clicks
  const handleNavClick = (sectionId) => {
    isManualScrolling.current = true;
    setActiveSection(sectionId);

    // Re-enable scroll listener after the smooth scroll animation finishes (approx 800ms)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 800); 
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="central-page">
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
            <Link to="/" className={!isAboutPage && activeSection === 'home' ? 'active-nav-link' : ''}>HOME</Link>
            <button
              type="button"
              onClick={() => navigate('/about')}
              className={isAboutPage || activeSection === 'about' ? 'active-nav-link nav-link-button' : 'nav-link-button'}
            >
              ABOUT
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('services')}
              className={activeSection === 'services' ? 'active-nav-link nav-link-button' : 'nav-link-button'}
            >
              SERVICES
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className={activeSection === 'contact' ? 'active-nav-link nav-link-button' : 'nav-link-button'}
            >
              CONTACT
            </button>
            <Link to="/apply" className="central-apply-btn">
              APPLY HERE
            </Link>
          </nav>
        </div>
      </header>

      {!isAboutPage && (
        <section 
          id="home" 
          className="hero-section" 
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImage})` }}
        >
          <div className="hero-content">
            <h1 className="hero-title">
              Moving Cargoes,<br />Moving Forward
            </h1>
            <p className="hero-subtitle">
              Commitment to quality service is our priority.
            </p>
            <button className="hero-cta-btn">
              See our Services
            </button>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-container about-reference-wrap">
          <div className="about-top-heading">
            <h2>ABOUT US</h2>
            <p>6R Diamond International Cargo Logistics Inc.</p>
          </div>

          <div className="about-feature-row">
            <div className="about-copy-block">
              <p>
                As the demand for freight servicing increases, this one stop shop continues to move forward in developing up-to-date strategies and
                mechanisms to accomodate the needs of our clients while upholding our commitment of providing cost-efficient and quality service. Above all, the
                company&apos;s integrity is of utmost importance.
              </p>
            </div>
            <div className="about-photo-block">
              <img src={aboutOfficeImg} alt="6R Diamond office reception" />
            </div>
          </div>

          <div className="about-feature-row reverse">
            <div className="about-photo-block">
              <img src={aboutHistoryImg} alt="Aerial cargo ship at port" />
            </div>
            <div className="about-copy-block">
              <h3>OUR HISTORY</h3>
              <p>
                With more than four decades of experience in providing customs clearance and brokerage services, the founding president and CEO emerita of
                the company, Cresenciana Cruz, formally established 6R Diamond International Cargo Logistics, Inc. on January 7, 2007.
                Through this expansion, the company evolved from a simple customs brokerage to a freight forwarding company that offers a wide range of
                transportation and logistic services for importing and exporting customers both domestically and internationally.
              </p>
            </div>
          </div>

          <div className="about-pillars-grid">
            <article className="pillar-card">
              <div className="pillar-icon" aria-hidden="true">|||</div>
              <h4>OUR MISSION</h4>
              <p>
                Our company&apos;s top priority is to cater to the evolving needs of our customers by delivering quality and cost-efficient logistics and transportation
                solutions. We commit to ensure the total satisfaction of our clients by continuously improving our productivity through technological
                advancements and strategic innovations.
              </p>
            </article>

            <article className="pillar-card">
              <div className="pillar-icon" aria-hidden="true">/\\</div>
              <h4>OUR VISION</h4>
              <p>
                With the combined efforts of our motivated and experienced professionals, our vision is to be one of the leading providers of Logistics,
                Non-Vessel Operating Common Carrier, Trading and Consultancy Services recognized internationally. Moreover, our company envisions itself
                as a catalyst of social and economic change in the trade industry through freight forwarding.
              </p>
            </article>

            <article className="pillar-card">
              <h4>Professionalism</h4>
              <p>
                Our company consists of highly trained and well-experienced professionals in the field of logistics, freight forwarding, and customs brokerage.
              </p>
            </article>

            <article className="pillar-card">
              <h4>Partnership</h4>
              <p>
                Putting premium in aligning with prestigious and reputable players in the industry, 6R DIAMOND INT&apos;L CARGO LOGISTICS INC. time and resources were
                invested in the careful selection of domestic and international partners.
              </p>
            </article>
          </div>
        </div>
      </section>
      <div className="bottom-content-wrapper">
        <section id="services" className="services-list-section">
          <div className="central-container services-other-wrap">
            <div className="services-other-copy">
              <h2 className="section-title-blue other-services-title">Other Services</h2>
              <ul className="service-list other-services-list">
                <li>Non Vessel Operation Common Carrier (NVOCC)</li>
                <li>International Air and Sea Freight Forwarding</li>
                <li>Domestic Air and Sea Freight Forwarding</li>
                <li>Inland Transportation</li>
                <li>Breakbulk Agent</li>
                <li>Customs Clearance/Brokerage</li>
                <li>Packing/Crating</li>
                <li>Haulage/Heavy Lift Equipments</li>
                <li>Logistics &amp; Warehousing</li>
                <li>Vessel Chartering/Project Cargo (Tugboat and Barge/LCT)</li>
                <li>Cargo Door to Door (Personal House Hold Goods Effect)</li>
              </ul>
            </div>
            <div className="services-other-image-wrap">
              <img src={servicesOtherImg} alt="Cargo ship and airplane" className="services-other-image" />
            </div>
          </div>
        </section>

        <section className="delivery-equipment-section">
          <div className="central-container delivery-equipment-wrap">
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

        <section className="partners-section">
          <div className="central-container">
            <h2 className="section-title-blue">OUR PARTNERS AND AFFILIATIONS</h2>
            <div className="partners-grid">
              <img src={'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Philippine_Economic_Zone_Authority_%28PEZA%29.svg/500px-Philippine_Economic_Zone_Authority_%28PEZA%29.svg.png'} alt="PEZA" />
              <img src={'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Civil_Aeronautics_Board.svg/1280px-Civil_Aeronautics_Board.svg.png'} alt="Civil Aeronautics Board" />
              <img src={'https://novotrans.com.ph/resources/img/psb.png'} alt="Customs" />
              <img src={'https://www.6r-diamond.com/assets/philexport.png'} alt="Philexport" />
              <img src={'https://www.6r-diamond.com/assets/fobap-onlus.png'} alt="Fobap" />
            </div>
          </div>
        </section>

        <section id="contact" className="footer-cta-bar">
          <div className="central-container cta-split">
            <div className="cta-message">
              <h3><strong>Hundreds of companies</strong> were already helped by us</h3>
              <p>Let us know how we can help you better</p>
            </div>
            <button className="contact-yellow-btn">
              Contact Us <span className="arrow">→</span>
            </button>
          </div>
        </section>
      </div>

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
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About Us</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact Us</a></li>
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

export default Central;

