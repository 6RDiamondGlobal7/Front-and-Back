import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import heroImage from '../../assets/cargo.jpg';
import PortImg from '../../assets/Portscrates.png';
import './Central.css';

const Central = () => {
  const [activeSection, setActiveSection] = useState('home');
  // Add a ref to track if we are currently performing a manual click-scroll
  const isManualScrolling = useRef(false);
  const scrollTimeout = useRef(null);

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
            <a 
              href="#home" 
              onClick={() => handleNavClick('home')}
              className={activeSection === 'home' ? 'active-nav-link' : ''}
            >HOME</a>
            <a 
              href="#about" 
              onClick={() => handleNavClick('about')}
              className={activeSection === 'about' ? 'active-nav-link' : ''}
            >ABOUT</a>
            <a 
              href="#services" 
              onClick={() => handleNavClick('services')}
              className={activeSection === 'services' ? 'active-nav-link' : ''}
            >SERVICES</a>
            <a 
              href="#contact" 
              onClick={() => handleNavClick('contact')}
              className={activeSection === 'contact' ? 'active-nav-link' : ''}
            >CONTACT</a>
            <Link to="/apply" className="central-apply-btn">
              APPLY HERE
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
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

      {/* WHO WE ARE Section */}
      <section id="about" className="about-section top-accent-line">
        <div className="section-container about-grid-container">
          <div className="about-image-wrapper">
            <img src={PortImg} alt="Cargo Terminal" className="about-main-image" />
          </div>
          <div className="about-text-content">
            <h2 className="about-title-small">WHO WE ARE</h2>
            <div className="about-description-simple">
              <p>
                We are a freight forwarding company with more than four decades in the industry. 
                We pride ourselves in providing quality service on freight forwarding, 
                transportation, and brokerage services. Moreover, we also offer a wide range of 
                transportation and logistic solutions for importing and exporting clients 
                domestically and internationally.
              </p>
            </div>
            <button className="about-learn-more">
              Learn More
            </button>
          </div>
        </div>

        <div className="global-map-overlay">
          <div className="map-content">
            <h3 className="map-subtitle">FROM PORTS TO INLAND TERMINALS</h3>
            <h2 className="map-title">TO DIFFERENT PARTS OF THE WORLD</h2>
            <p className="map-locations">
              CHINA • HONG KONG • MALAYSIA • TAIWAN • THAILAND • SINGAPORE<br />
              KOREA • JAPAN • USA • SPAIN • PORTUGAL • AUSTRALIA • AFRICA
            </p>
            <div className="world-map-graphic"></div> 
          </div>
        </div>

        {/* Business Solutions Section */}
        <div id="services" className="business-solutions-yellow">
          <div className="section-container">
            <div className="solutions-intro-grid">
              <div className="solutions-image-box">
                <img src={'https://projectcargo.com.tr/images/bg-img/col-bgimage-1.jpg'} alt="Cargo Terminal" className="solutions-main-img" />
              </div>
              <div className="solutions-text-box">
                <h2 className="solutions-title">BUSINESS SOLUTIONS</h2>
                <p className="solutions-text">
                  Our extensive range of expertise and services are well-integrated to provide 
                  our clients their needs and quality service they deserve. Our versatility allows 
                  our client to negotiate and customize our services in accordance to their desired 
                  outcome, while considering the optimal costs for both parties.
                </p>
                <button className="blue-discover-btn">Discover More</button>
              </div>
            </div>

            <div className="services-cards-grid">
              <div className="service-horizontal-card">
                <div className="card-image" style={{backgroundImage: `url(${'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=400&fit=crop'})`}}></div>
                <div className="card-content">
                  <h3>Sea Freight Forwarding</h3>
                  <p>Being a Non-Vessel Operating Common Carrier (NVOCC), 6R Diamond aims to be globally recognized.</p>
                  <button className="yellow-card-btn">Learn More</button>
                </div>
              </div>

              <div className="service-horizontal-card">
                <div className="card-image" style={{backgroundImage: `url(${'https://s.yimg.com/ny/api/res/1.2/GBXm7hmH7CmH51QkEt1N6Q--/YXBwaWQ9aGlnaGxhbmRlcjt3PTY0MDtoPTM2MA--/https://media.zenfs.com/en/freightwaves_373/8c1fad91746c4f13eccac14ee9823d64'})`}}></div>
                <div className="card-content">
                  <h3>Air Freight Forwarding</h3>
                  <p>6R Diamond upholds its commitment of providing fast, reliable and cost-efficient air freight.</p>
                  <button className="yellow-card-btn">Learn More</button>
                </div>
              </div>

              <div className="service-horizontal-card">
                <div className="card-image" style={{backgroundImage: `url(${'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop'})`}}></div>
                <div className="card-content">
                  <h3>Customs Clearance and Brokerage</h3>
                  <p>With more than 40 years of experience in providing customs clearance and brokerage services.</p>
                  <button className="yellow-card-btn">Learn More</button>
                </div>
              </div>

              <div className="service-horizontal-card">
                <div className="card-image" style={{backgroundImage: `url(${'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop'})`}}></div>
                <div className="card-content">
                  <h3>Inland Transportation</h3>
                  <p>6R Diamond offers a wide-range of inland transport services to its clients.</p>
                  <button className="yellow-card-btn">Learn More</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="bottom-content-wrapper">
        <section className="services-list-section">
          <div className="central-container">
            <h2 className="section-title-blue">OUR SERVICES</h2>
            <div className="services-columns-wrapper">
              <ul className="service-list">
                <li>Non-vessel Operating Common Carrier (NVOCC)</li>
                <li>International Air and Sea Freight Forwarding</li>
                <li>Domestic Air and Sea Freight Forwarding</li>
                <li>Customs Clearance and Brokerage</li>
                <li>Inland Transportation Services</li>
                <li>Breakbulk Agency</li>
                <li>Import and Export Requirements Assistance</li>
              </ul>
              <ul className="service-list">
                <li>Documentation Services</li>
                <li>Packing and Crating</li>
                <li>Haulage and Heavy Lift Equipment</li>
                <li>Vessel Chartering</li>
                <li>Project Cargo (Tugboat and Barge / LCT)</li>
                <li>Cargo Door to Door (Personal Household Goods Effect)</li>
              </ul>
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
              <h3>Let us know how we can be of help. We will be glad to serve you.</h3>
              <p>See how we can help you move forward.</p>
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