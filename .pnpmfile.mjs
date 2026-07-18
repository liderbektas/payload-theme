/**
 * Deliberate no-op pnpmfile.
 *
 * Some environments (pnpm installed via pnpm/action-setup on GitHub's Linux
 * runners) resolve `.pnpmfile.mjs` unconditionally for ESM workspaces and
 * fail `pnpm run` when the file is missing. Providing an empty hooks object
 * keeps every environment happy without altering resolution in any way.
 */
export default { hooks: {} }
