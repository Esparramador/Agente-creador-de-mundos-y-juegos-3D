// Lógica pura de la selección de campeón al estilo Wild Rift (sin DOM; se prueba en tests/seleccion.test.mjs):
// posiciones, equipo aliado con bots ya asignados, rivales, filtros por rol y búsqueda, cuenta atrás e intercambio de posición.
import { CHAMPIONS } from './data.js';

export const POSICIONES = [
  { id: 'top',     nombre: 'CALLE DEL BARÓN', icon: '⚔' },
  { id: 'jungle',  nombre: 'JUNGLA',          icon: '🌿' },
  { id: 'mid',     nombre: 'CALLE CENTRAL',   icon: '✦' },
  { id: 'bot',     nombre: 'CALLE DEL DRAGÓN', icon: '🐉' },
  { id: 'support', nombre: 'SOPORTE',         icon: '✚' },
];
export const POS_BY_ID = Object.fromEntries(POSICIONES.map(p => [p.id, p]));
export const ROLES_FILTRO = [
  { id: 'todos', nombre: 'Todos', icon: '▦' }, { id: 'Tanque', nombre: 'Tanque', icon: '🛡' }, { id: 'Luchador', nombre: 'Luchador', icon: '⚔' },
  { id: 'Asesino', nombre: 'Asesino', icon: '🗡' }, { id: 'Mago', nombre: 'Mago', icon: '✴' }, { id: 'Tirador', nombre: 'Tirador', icon: '🏹' }, { id: 'Soporte', nombre: 'Soporte', icon: '✚' },
];

/** Posiciones en las que encaja un campeón según su rol de ficha («Mid / Top», «Carril inferior (tirador)», …). */
export function posicionesDe(c) {
  const r = c.role || '', out = [];
  if (/Top/.test(r)) out.push('top');
  if (/Jungla/.test(r)) out.push('jungle');
  if (/Mid/.test(r)) out.push('mid');
  if (/inferior|Tirador/i.test(r) || c.class === 'Tirador') out.push('bot');
  if (/Soporte/.test(r) || c.class === 'Soporte') out.push('support');
  return out.length ? [...new Set(out)] : ['mid'];
}
/** Posición principal: la misma regla que ROLE_OF en world.js (así el bot juega donde la selección dice). */
export function posicionPrincipal(c) {
  return /Jungla/.test(c.role) ? 'jungle' : c.class === 'Soporte' ? 'support' : c.class === 'Tirador' ? 'bot' : /Mid/.test(c.role) ? 'mid' : 'top';
}
export const recomendados = (pos, champs = CHAMPIONS) => champs.filter(c => posicionesDe(c).includes(pos)).map(c => c.id);

/** Filtro de la rejilla: rol (clase) y texto (nombre, sin tildes ni mayúsculas). */
const plano = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function filtrar({ rol = 'todos', texto = '' } = {}, champs = CHAMPIONS) {
  const q = plano(texto).trim();
  return champs.filter(c => (rol === 'todos' || c.class === rol) && (!q || plano(c.name).includes(q) || plano(c.title).includes(q)));
}

const pickFor = (pos, taken, rand, champs) => {
  const libres = champs.filter(c => !taken.has(c.id));
  const fits = libres.filter(c => posicionPrincipal(c) === pos), fits2 = libres.filter(c => posicionesDe(c).includes(pos));
  const pool = fits.length ? fits : fits2.length ? fits2 : libres;
  return pool[Math.floor(rand() * pool.length)].id;
};

/** Crea la sala: el jugador en `jugadorPos` (o al azar), 4 bots aliados ya asignados y 5 rivales (ocultos hasta los últimos 10 s). */
export function crearSeleccion({ rand = Math.random, jugadorPos = null, champs = CHAMPIONS, nombres = null } = {}) {
  const pos = jugadorPos || POSICIONES[Math.floor(rand() * POSICIONES.length)].id;
  const taken = new Set();
  const aliados = POSICIONES.map((p, i) => {
    if (p.id === pos) return { pos: p.id, champ: null, esJugador: true, nombre: 'Tú' };
    const champ = pickFor(p.id, taken, rand, champs); taken.add(champ);
    return { pos: p.id, champ, esJugador: false, nombre: (nombres && nombres[i]) || `Aliado ${i + 1}` };
  });
  const rivales = POSICIONES.map((p, i) => { const champ = pickFor(p.id, taken, rand, champs); taken.add(champ); return { pos: p.id, champ, nombre: `Rival ${i + 1}`, visible: false }; });
  return { pos, aliados, rivales, champs };
}
export const jugador = sel => sel.aliados.find(a => a.esJugador);
export const ocupados = sel => new Set([...sel.aliados.map(a => a.champ), ...sel.rivales.map(r => r.champ)].filter(Boolean));

/** El jugador elige (o preselecciona) un campeón; si un bot aliado lo tenía, el bot vuelve a elegir otro para su posición. */
export function elegirCampeon(sel, id, rand = Math.random) {
  const j = jugador(sel); j.champ = id;
  const bot = sel.aliados.find(a => !a.esJugador && a.champ === id);
  if (bot) { const taken = ocupados(sel); bot.champ = pickFor(bot.pos, taken, rand, sel.champs); }
  return sel;
}
/** Petición de cambio de posición con el bot que ocupa `pos`: los bots siempre aceptan y vuelven a elegir campeón para su nueva posición. */
export function intercambiarPosicion(sel, pos, rand = Math.random) {
  const j = jugador(sel), bot = sel.aliados.find(a => !a.esJugador && a.pos === pos);
  if (!bot || j.pos === pos) return false;
  [j.pos, bot.pos] = [bot.pos, j.pos]; sel.pos = j.pos;
  const taken = ocupados(sel); taken.delete(bot.champ); bot.champ = pickFor(bot.pos, taken, rand, sel.champs);
  sel.aliados.sort((a, b) => POSICIONES.findIndex(p => p.id === a.pos) - POSICIONES.findIndex(p => p.id === b.pos));
  return true;
}
/** Cuenta atrás real de la selección: 60 s; los rivales se revelan en los últimos 10 s; al llegar a 0 se fija el campeón marcado o uno al azar. */
export function crearCuentaAtras(total = 60, revelarA = 10) {
  const c = { total, restante: total, revelar: false, agotada: false,
    tick(dt) { if (c.agotada) return c; c.restante = Math.max(0, c.restante - dt); c.revelar = c.restante <= revelarA; c.agotada = c.restante <= 0; return c; },
    get segundos() { return Math.ceil(c.restante); } };
  return c;
}
/** Campeón con el que arranca la partida al agotarse el tiempo: el marcado o, si no hay, uno libre al azar que encaje en la posición. */
export function campeonFinal(sel, rand = Math.random) {
  const j = jugador(sel); if (j.champ) return j.champ;
  const taken = ocupados(sel); return pickFor(j.pos, taken, rand, sel.champs);
}
/** Alineación para `new Game({ lineup })`: el jugador primero en el equipo 0 con sus hechizos, set y runas; bots y rivales con su posición. */
export function alineacion(sel, { champ, summoners, itemSet, runes, setId } = {}) {
  const j = jugador(sel);
  const t0 = [{ id: champ || j.champ, role: j.pos, summoners, itemSet, runes, setId }, ...sel.aliados.filter(a => !a.esJugador).map(a => ({ id: a.champ, role: a.pos }))];
  const t1 = sel.rivales.map(r => ({ id: r.champ, role: r.pos }));
  return { 0: t0, 1: t1 };
}
