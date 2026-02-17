import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <>
      <div className="hero-section">
        <div className="hero-content">
          <img src="/img/dark.svg" alt="Bankuity Logo" className="hero-logo" />
          <p className="hero-tagline">{siteConfig.tagline}</p>
        </div>
      </div>
      <div className="cards-container">
      {/* Card 1: What is Bankuity? */}
      <a href="/guides/overview" className="card-link">
        <div className="card-image-wrapper">
          <img noZoom src="/bankuity_logo/home-1.svg" />
        </div>
        <div className="card-content">
          <h3 className="card-title">What is Bankuity?</h3>
          <p className="card-description">
            Discover how our behavioral analytics and transaction enrichment provide deep insights into financial stability.
          </p>
        </div>
      </a>

      {/* Card 2: Get Started */}
      <a href="/guides/generate-analysis" className="card-link">
        <div className="card-image-wrapper">
          <img noZoom src="/bankuity_logo/home-2.svg" />
        </div>
        <div className="card-content">
          <h3 className="card-title">Get Started</h3>
          <p className="card-description">
            Learn how to authenticate into our API and perform your first analysis request.
          </p>
        </div>
      </a>

      {/* Card 3: API Reference */}
      <a href="/api-reference/introduction" className="card-link">
        <div className="card-image-wrapper">
          <img noZoom src="/bankuity_logo/home-3.svg" />
        </div>
        <div className="card-content">
          <h3 className="card-title">API Reference</h3>
          <p className="card-description">
            Explore endpoints for income analysis, bank account verification, and automated lending recommendations.
          </p>
        </div>
      </a>
    </div>
    </>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}

