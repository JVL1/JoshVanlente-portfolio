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
  // Velite exposes every item, including drafts, through #content. The loader
  // is the one place that applies the published-only rule before rendering.
  // Keep that boundary enforceable so a later route cannot publish a draft by
  // importing generated data directly.
  {
    files: ["src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "#content",
              message:
                "Import published work through @/lib/content; only src/lib/content.ts may read #content.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression[source.value='#content']",
          message:
            "Import published work through @/lib/content; only src/lib/content.ts may read #content.",
        },
      ],
    },
  },
  {
    files: ["src/lib/content.ts"],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
    },
  },
];

export default config;
