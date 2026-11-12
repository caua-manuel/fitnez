export function resolveBasePath(env: Record<string, string | undefined>): string {
  const explicit = env.VITE_BASE_PATH;
  let base = '/Projeto-Treino/';
  if (explicit !== undefined) {
    base = explicit;
  } else if (env.CI && env.GITHUB_REPOSITORY) {
    const parts = env.GITHUB_REPOSITORY.split('/');
    if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_.-]+$/.test(part))) {
      throw new Error('GITHUB_REPOSITORY deve conter dono/repositorio válido.');
    }
    const [owner, repo] = parts;
    base = repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? '/' : `/${repo}/`;
  }
  if (!/^\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]*\/?$/.test(base)
      || base.split('/').some(part => part === '.' || part === '..')
      || base.includes('//')) {
    throw new Error('VITE_BASE_PATH deve ser um caminho local absoluto, sem protocolo, query, fragmento ou segmentos . e ...');
  }
  return base.endsWith('/') ? base : `${base}/`;
}
