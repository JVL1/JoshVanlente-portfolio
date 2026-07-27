import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  // Generated or vendored trees. `.velite` is Velite's build output and
  // `.next` is Next's; linting either reports on code nobody wrote.
  // `tests/.tmp` holds fixture trees a schema test built and has not cleaned up
  // yet, including Velite output; a run that dies before its teardown leaves
  // them behind, and Task 21 lints immediately after running the suite.
  {
    ignores: [
      ".next/**",
      ".velite/**",
      "node_modules/**",
      "public/static/**",
      "tests/.tmp/**",
    ],
  },
  ...nextCoreWebVitals,
];

export default config;
