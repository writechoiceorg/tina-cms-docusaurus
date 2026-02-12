import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";

export default function Forbidden() {
  return (
    <Layout title="Access Denied">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: "3rem", fontWeight: "bold" }}>🚫 403</h1>
          <h2>Access Denied</h2>
          <p>You do not have the required permissions to view this resource.</p>
          <div style={{ marginTop: "20px" }}>
            <Link className="button button--primary button--lg" to="/">
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
