import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      "nuxt_sunpyramids/**",
      ".next/**",
      "node_modules/**",
      "public/**",
      "output/**",
      ".impeccable/**",
    ],
  },
  ...nextVitals,
];

export default config;
