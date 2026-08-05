import type { NextConfig } from "next";

// GitHub Pages serves a project site (not a custom domain or a
// <owner>.github.io user/org site) from a /<repo-name>/ subpath, so every
// internal link and asset URL needs that prefix baked in at build time.
// GITHUB_REPOSITORY (set automatically in Actions) is "<owner>/<repo>" -
// deriving the path from it means this keeps working if the repo is renamed.
function githubPagesBasePath(): string {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!process.env.GITHUB_ACTIONS || !repository) return "";

  const [owner, repo] = repository.split("/");
  const isUserOrOrgSite = repo?.toLowerCase() === `${owner?.toLowerCase()}.github.io`;
  return isUserOrOrgSite ? "" : `/${repo}`;
}

const basePath = githubPagesBasePath();

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  // Exposed to client code so it can build correct absolute links/assets.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
