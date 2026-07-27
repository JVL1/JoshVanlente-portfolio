import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  // Generated or vendored trees. `.velite` is Velite's build output and
  // `.next` is Next's; linting either reports on code nobody wrote.
  { ignores: [".next/**", ".velite/**", "node_modules/**", "public/static/**"] },
  ...nextCoreWebVitals,
];

export default config;
