function normalizeSegment(path: string): string {
  if (path.length === 0) return '.';

  const absolute = path.startsWith('/');
  const parts = path.split('/').filter((segment) => segment.length > 0 && segment !== '.');
  const normalized: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      if (normalized.length > 0 && normalized[normalized.length - 1] !== '..') {
        normalized.pop();
      } else if (!absolute) {
        normalized.push('..');
      }
      continue;
    }

    normalized.push(part);
  }

  const joined = normalized.join('/');

  if (absolute) {
    return joined.length > 0 ? `/${joined}` : '/';
  }

  return joined.length > 0 ? joined : '.';
}

export function normalize(path: string): string {
  return normalizeSegment(path);
}

export function join(...parts: string[]): string {
  return normalizeSegment(parts.filter((part) => part.length > 0).join('/'));
}

export function dirname(path: string): string {
  const normalized = normalizeSegment(path);

  if (normalized === '/' || normalized === '.') return '.';

  const trimmed = normalized.endsWith('/') && normalized !== '/' ? normalized.slice(0, -1) : normalized;
  const index = trimmed.lastIndexOf('/');

  if (index === -1) return '.';
  if (index === 0) return '/';

  return trimmed.slice(0, index);
}

export const posix = {
  dirname,
  join,
  normalize,
};

export default {
  dirname,
  join,
  normalize,
  posix,
};
