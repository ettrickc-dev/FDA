// Minimal in-memory stand-in for the Supabase client, enough for function tests.
import { randomUUID } from 'node:crypto';

const DEFAULTS = {
  documents_generated: () => ({ generated_at: new Date().toISOString() }),
  payments: () => ({ created_at: new Date().toISOString(), status: 'pending' }),
  audit_log: () => ({ at: new Date().toISOString() }),
  cases: () => ({ status: 'draft', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
};

export function fakeDb({ users = {} } = {}) {
  const tables = {};
  const T = (name) => (tables[name] ||= []);

  class Q {
    constructor(table) { this.table = table; this.filters = []; this.op = 'select'; this._order = null; this._limit = null; this.opts = {}; }
    select(cols, opts = {}) { if (this.op === 'select') this.opts = opts; this._returning = true; return this; }
    insert(rows) { this.op = 'insert'; this.rows = Array.isArray(rows) ? rows : [rows]; return this; }
    update(patch) { this.op = 'update'; this.patch = patch; return this; }
    upsert(row, { onConflict } = {}) { this.op = 'upsert'; this.rows = [row]; this.conflict = onConflict.split(','); return this; }
    delete() { this.op = 'delete'; return this; }
    eq(c, v) { this.filters.push((r) => r[c] === v); return this; }
    neq(c, v) { this.filters.push((r) => r[c] !== v); return this; }
    gte(c, v) { this.filters.push((r) => r[c] >= v); return this; }
    lt(c, v) { this.filters.push((r) => r[c] < v); return this; }
    in(c, vs) { this.filters.push((r) => vs.includes(r[c])); return this; }
    is(c, v) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
    order(c, { ascending = true } = {}) { this._order = [c, ascending]; return this; }
    limit(n) { this._limit = n; return this; }
    single() { this._single = 'single'; return this; }
    maybeSingle() { this._single = 'maybe'; return this; }
    match(r) { return this.filters.every((f) => f(r)); }
    run() {
      const rows = T(this.table);
      let data;
      if (this.op === 'insert') {
        data = this.rows.map((r) => ({ id: randomUUID(), ...(DEFAULTS[this.table]?.() || {}), ...r }));
        rows.push(...data);
      } else if (this.op === 'upsert') {
        data = this.rows.map((r) => {
          const ex = rows.find((x) => this.conflict.every((k) => x[k] === r[k]));
          if (ex) return Object.assign(ex, r);
          const n = { id: randomUUID(), ...r }; rows.push(n); return n;
        });
      } else if (this.op === 'update') {
        data = rows.filter((r) => this.match(r));
        data.forEach((r) => Object.assign(r, this.patch));
      } else if (this.op === 'delete') {
        data = rows.filter((r) => this.match(r));
        tables[this.table] = rows.filter((r) => !this.match(r));
      } else {
        data = rows.filter((r) => this.match(r));
        if (this._order) {
          const [c, asc] = this._order;
          data = [...data].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1));
        }
        if (this._limit !== null) data = data.slice(0, this._limit);
      }
      data = data.map((r) => ({ ...r }));
      const count = data.length;
      if (this.opts.head) return { data: null, error: null, count };
      if (this._single) {
        if (data.length === 0) return this._single === 'maybe' ? { data: null, error: null } : { data: null, error: { message: 'no rows' } };
        return { data: data[0], error: null };
      }
      return { data, error: null, count };
    }
    then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
  }

  return {
    tables, T,
    from: (t) => new Q(t),
    auth: {
      getUser: async (token) => (users[token] ? { data: { user: users[token] }, error: null } : { data: null, error: { message: 'bad token' } }),
    },
  };
}
