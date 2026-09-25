#!/usr/bin/env python3
"""Idempotent finalizer for config/a11y-baseline.ts: ensures the file ends with
the CANONICAL helper functions (class-chain sorting + wildcard support),
regardless of what the generator wrote.

Usage: python3 fix-a11y-footer.py <baseline-path>
"""
import sys

path = sys.argv[1]
text = open(path).read()

anchor = 'export function normalizeA11yTarget'
idx = text.find(anchor)
if idx == -1:
    # No helpers at all yet -> append.
    head = text
else:
    head = text[:idx]

head = head.rstrip('\n')

FOOTER = '''

/**
 * Normalize an axe node target (array of selectors, possibly nested for iframes)
 * into a comparable string: flattened, nth-child/nth-of-type stripped,
 * whitespace collapsed, class chains sorted (axe may emit the same element with
 * a different class order between runs).
 */
export function normalizeA11yTarget(target: readonly unknown[]): string {
  const flat = target
    .map((part) => (Array.isArray(part) ? part.join(' >>> ') : String(part)))
    .join(' ');
  return canonicalizeSelector(flat);
}

function canonicalizeSelector(selector: string): string {
  return selector
    .replace(/:nth-child\\(\\d+\\)/g, '')
    .replace(/:nth-of-type\\(\\d+\\)/g, '')
    .replace(/\\s+/g, ' ')
    .trim()
    .replace(/(?:\\.[A-Za-z0-9_-]+){2,}/g, (chain) =>
      chain
        .split('.')
        .filter(Boolean)
        .sort()
        .map((cls) => `.${cls}`)
        .join(''),
    );
}

export function isKnownA11yViolation(route: string, violation: string, target: readonly unknown[]): boolean {
  const normalized = normalizeA11yTarget(target);
  return a11yBaseline.some((rule) =>
    rule.violation === violation
    && (rule.routes.includes('*') || rule.routes.includes(route))
    && (rule.targets.includes('*') || rule.targets.some((pattern) => normalized.includes(pattern))),
  );
}
'''

with open(path, 'w') as fh:
    fh.write(head + FOOTER)

print('FINALIZED', path, '| canonical helpers present:', 'canonicalizeSelector' in open(path).read())

# --- Validate: target patterns must be canonical or they cannot match ---------
import json as _json
import re as _re


def _canon(s: str) -> str:
    s = _re.sub(r':nth-child\(\d+\)', '', s)
    s = _re.sub(r':nth-of-type\(\d+\)', '', s)
    s = _re.sub(r'\s+', ' ', s).strip()

    def _sort_chain(m):
        classes = [c for c in m.group(0).split('.') if c]
        return ''.join('.' + c for c in sorted(classes))

    return _re.sub(r'(?:\.[A-Za-z0-9_-]+){2,}', _sort_chain, s)


final = open(path).read()
match = _re.search(r'=\s*(\[.*?\n\]);', final, _re.S)
warnings = []
if match:
    try:
        parsed_rules = _json.loads(match.group(1))
        for rule in parsed_rules:
            for target in rule.get('targets', []):
                if target == '*' or _canon(target) == target:
                    continue
                warnings.append('%s :: %s' % (rule['violation'], target))
    except ValueError as exc:
        warnings.append('could not parse baseline rules: %s' % exc)

if warnings:
    print('WARN: non-canonical target patterns (will never match):')
    for warning in warnings:
        print('  -', warning)
else:
    print('canonical patterns: OK')
