import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

/* src/pages/index.js */
// ... imports remain the same

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        
        {/* Tech Lead Update: Separated entry points for your 3 tiers */}
        <div className={styles.buttons} style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px'}}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/public/intro"> {/* Assumes you have docs/public/intro.md */}
            Public Docs 🌍
          </Link>
          <Link
            className="button button--warning button--lg" // distinct color for beta
            to="/docs/beta/intro">
            Beta Access 🚧
          </Link>
          <Link
            className="button button--info button--lg" // distinct color for enterprise
            to="/docs/enterprise/intro">
            Enterprise 🏢
          </Link>
        </div>
      </div>
    </header>
  );
}

// ... rest of the file remains the same

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
