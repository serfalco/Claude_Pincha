// Template tag mínimo: escapa todo valor interpolado salvo que venga marcado como HTML seguro.
const RAW = Symbol('raw');

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escape = (v) => String(v).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const raw = (s) => ({ [RAW]: true, value: String(s) });

const render = (v) => {
  if (v == null || v === false) return '';
  if (Array.isArray(v)) return v.map(render).join('');
  if (v[RAW]) return v.value;
  return escape(v);
};

export const html = (strings, ...values) =>
  raw(strings.reduce((out, s, i) => out + s + (i < values.length ? render(values[i]) : ''), ''));

export const toString = (fragment) => render(fragment);
