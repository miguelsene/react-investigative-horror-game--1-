export const COLS = 'ABCDEFGHIJKL'.split('');

export function parseRef(ref: string): [number, number] | null {
  const m = /^([A-L])(\d{1,2})$/i.exec(ref.trim());
  if (!m) return null;
  return [COLS.indexOf(m[1].toUpperCase()), parseInt(m[2], 10)];
}

function expandRange(a: string, b: string): string[] {
  const pa = parseRef(a);
  const pb = parseRef(b);
  if (!pa || !pb) throw new Error('#REF!');
  const out: string[] = [];
  for (let c = Math.min(pa[0], pb[0]); c <= Math.max(pa[0], pb[0]); c++)
    for (let r = Math.min(pa[1], pb[1]); r <= Math.max(pa[1], pb[1]); r++) out.push(`${COLS[c]}${r}`);
  return out;
}

export type CellValue = number | string;

export function evaluateSheet(cells: Record<string, string>) {
  const cache: Record<string, CellValue> = {};
  const visiting = new Set<string>();

  const valueOf = (ref: string): CellValue => {
    const key = ref.toUpperCase();
    if (key in cache) return cache[key];
    if (visiting.has(key)) throw new Error('#CICLO!');
    visiting.add(key);
    let v: CellValue;
    const raw = cells[key] ?? '';
    try {
      v = compute(raw);
    } catch (e: any) {
      v = typeof e?.message === 'string' && e.message.startsWith('#') ? e.message : '#ERRO!';
    }
    visiting.delete(key);
    cache[key] = v;
    return v;
  };

  const num = (ref: string): number => {
    const v = valueOf(ref);
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.startsWith('#')) throw new Error(v);
    if (v === '') return 0;
    const n = Number(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const compute = (raw: string): CellValue => {
    const s = raw.trim();
    if (s === '') return '';
    if (!s.startsWith('=')) {
      const n = Number(s.replace(',', '.'));
      return !isNaN(n) && /^-?[\d.,]+$/.test(s) ? n : raw;
    }
    return evalExpr(s.slice(1));
  };

  const evalExpr = (expr: string): number => {
    const tokens = expr.toUpperCase().match(/\s*([A-Z]+\(|[A-L]\d{1,2}:[A-L]\d{1,2}|[A-L]\d{1,2}|\d+(?:[.,]\d+)?|[-+*/(),;])\s*/g);
    if (!tokens || tokens.join('').replace(/\s/g, '') !== expr.toUpperCase().replace(/\s/g, '')) throw new Error('#ERRO!');
    const tk = tokens.map((t) => t.trim());
    let i = 0;
    const peek = () => tk[i];
    const next = () => tk[i++];

    const parseArgs = (): number[] => {
      const vals: number[] = [];
      if (peek() === ')') { next(); return vals; }
      while (true) {
        const t = peek();
        if (t && /^[A-L]\d{1,2}:[A-L]\d{1,2}$/.test(t)) {
          next();
          const [a, b] = t.split(':');
          expandRange(a, b).forEach((r) => {
            const v = valueOf(r);
            if (typeof v === 'number') vals.push(v);
            else if (typeof v === 'string' && v.startsWith('#')) throw new Error(v);
          });
        } else vals.push(parseAdd());
        const sep = next();
        if (sep === ')') break;
        if (sep !== ',' && sep !== ';') throw new Error('#ERRO!');
      }
      return vals;
    };

    const parsePrimary = (): number => {
      const t = next();
      if (t === undefined) throw new Error('#ERRO!');
      if (t === '(') {
        const v = parseAdd();
        if (next() !== ')') throw new Error('#ERRO!');
        return v;
      }
      if (t === '-') return -parsePrimary();
      if (t === '+') return parsePrimary();
      if (/^\d/.test(t)) return parseFloat(t.replace(',', '.'));
      if (/^[A-L]\d{1,2}$/.test(t)) return num(t);
      if (t.endsWith('(')) {
        const fn = t.slice(0, -1);
        const args = parseArgs();
        switch (fn) {
          case 'SUM': case 'SOMA': return args.reduce((a, b) => a + b, 0);
          case 'AVERAGE': case 'MEDIA': return args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0;
          case 'MIN': return args.length ? Math.min(...args) : 0;
          case 'MAX': return args.length ? Math.max(...args) : 0;
          default: throw new Error('#NOME?');
        }
      }
      throw new Error('#ERRO!');
    };

    const parseMul = (): number => {
      let v = parsePrimary();
      while (peek() === '*' || peek() === '/') {
        const op = next();
        const r = parsePrimary();
        if (op === '/' && r === 0) throw new Error('#DIV/0!');
        v = op === '*' ? v * r : v / r;
      }
      return v;
    };
    const parseAdd = (): number => {
      let v = parseMul();
      while (peek() === '+' || peek() === '-') {
        const op = next();
        const r = parseMul();
        v = op === '+' ? v + r : v - r;
      }
      return v;
    };

    const result = parseAdd();
    if (i < tk.length) throw new Error('#ERRO!');
    return Math.round(result * 1e10) / 1e10;
  };

  return { valueOf };
}

export function displayValue(v: CellValue): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return v;
}
