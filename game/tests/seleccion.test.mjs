// Pruebas de la lógica pura de la selección Wild Rift (seleccion.js): node --test game/tests/seleccion.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAMPIONS } from '../src/data.js';
import { rng } from '../src/core.js';
import * as SEL from '../src/seleccion.js';

test('posiciones: 5 con nombre Wild Rift; cada campeón encaja en ≥ 1 y su principal coincide con ROLE_OF', () => {
  assert.deepEqual(SEL.POSICIONES.map(p => p.id), ['top', 'jungle', 'mid', 'bot', 'support']);
  assert.deepEqual(SEL.POSICIONES.map(p => p.nombre), ['CALLE DEL BARÓN', 'JUNGLA', 'CALLE CENTRAL', 'CALLE DEL DRAGÓN', 'SOPORTE']);
  for (const c of CHAMPIONS) { const ps = SEL.posicionesDe(c); assert.ok(ps.length >= 1, c.id); assert.ok(SEL.POSICIONES.some(p => p.id === SEL.posicionPrincipal(c))); }
  assert.deepEqual(SEL.posicionesDe(CHAMPIONS.find(c => c.id === 'yssra')), ['top', 'mid']);
  assert.deepEqual(SEL.posicionesDe(CHAMPIONS.find(c => c.id === 'lyra')), ['bot']);
  assert.ok(SEL.recomendados('jungle').includes('rakhar') && !SEL.recomendados('jungle').includes('lyra'));
});
test('filtros: por rol reducen la rejilla; búsqueda por nombre sin tildes; «todos» devuelve 15', () => {
  assert.equal(SEL.filtrar({ rol: 'todos' }).length, 15);
  assert.equal(SEL.filtrar({ rol: 'Mago' }).length, 3);
  assert.deepEqual(SEL.filtrar({ rol: 'Tirador' }).map(c => c.id), ['lyra', 'gearix']);
  assert.deepEqual(SEL.filtrar({ texto: 'kae' }).map(c => c.id), ['kaelith']);
  assert.deepEqual(SEL.filtrar({ texto: 'NYXE' }).map(c => c.id), ['nyxe']);
  assert.equal(SEL.filtrar({ rol: 'Mago', texto: 'lyra' }).length, 0);
});
test('sala: 4 bots aliados en las otras posiciones y 5 rivales, 9 campeones distintos; cada bot encaja en su posición', () => {
  const sel = SEL.crearSeleccion({ rand: rng(7), jugadorPos: 'mid' });
  assert.equal(sel.pos, 'mid'); assert.equal(sel.aliados.length, 5); assert.equal(sel.rivales.length, 5);
  const j = SEL.jugador(sel); assert.equal(j.pos, 'mid'); assert.equal(j.champ, null);
  const ids = [...sel.aliados.filter(a => !a.esJugador), ...sel.rivales].map(x => x.champ);
  assert.equal(new Set(ids).size, 9);
  for (const a of sel.aliados.filter(a => !a.esJugador)) assert.ok(SEL.posicionesDe(CHAMPIONS.find(c => c.id === a.champ)).includes(a.pos), `${a.champ} en ${a.pos}`);
  assert.ok(sel.rivales.every(r => !r.visible), 'los rivales empiezan ocultos');
});
test('elegir un campeón que tenía un bot aliado hace que el bot cambie; el jugador se queda con él', () => {
  const sel = SEL.crearSeleccion({ rand: rng(3), jugadorPos: 'top' });
  const bot = sel.aliados.find(a => !a.esJugador); const id = bot.champ;
  SEL.elegirCampeon(sel, id, rng(9));
  assert.equal(SEL.jugador(sel).champ, id); assert.notEqual(bot.champ, id); assert.ok(!SEL.rivales || true);
  assert.equal(new Set(SEL.ocupados(sel)).size, 10);
});
test('intercambio de posición: el bot acepta, cambia de posición y vuelve a elegir campeón para la nueva; la lista queda ordenada', () => {
  const sel = SEL.crearSeleccion({ rand: rng(5), jugadorPos: 'support' });
  const bot = sel.aliados.find(a => a.pos === 'jungle'); const antes = bot.champ;
  assert.ok(SEL.intercambiarPosicion(sel, 'jungle', rng(2)));
  assert.equal(sel.pos, 'jungle'); assert.equal(SEL.jugador(sel).pos, 'jungle'); assert.equal(bot.pos, 'support');
  assert.ok(SEL.posicionesDe(CHAMPIONS.find(c => c.id === bot.champ)).includes('support'), 'el bot re-elige para Soporte');
  assert.deepEqual(sel.aliados.map(a => a.pos), ['top', 'jungle', 'mid', 'bot', 'support']);
  assert.equal(SEL.intercambiarPosicion(sel, 'jungle'), false, 'no se puede intercambiar con uno mismo');
  assert.ok(antes !== undefined);
});
test('cuenta atrás: 60 s reales, rivales a los 10 s, agotada a 0 y campeón final (el marcado o uno libre que encaje)', () => {
  const c = SEL.crearCuentaAtras(60);
  assert.equal(c.segundos, 60); c.tick(30); assert.equal(c.segundos, 30); assert.ok(!c.revelar && !c.agotada);
  c.tick(20.5); assert.equal(c.segundos, 10); assert.ok(c.revelar, 'se revelan los rivales a 10 s');
  c.tick(100); assert.equal(c.restante, 0); assert.ok(c.agotada); c.tick(5); assert.ok(c.agotada);
  const sel = SEL.crearSeleccion({ rand: rng(4), jugadorPos: 'bot' });
  const auto = SEL.campeonFinal(sel, rng(1)); assert.ok(['lyra', 'gearix'].includes(auto), 'al azar entre los que encajan en la posición');
  SEL.elegirCampeon(sel, 'vaelor'); assert.equal(SEL.campeonFinal(sel), 'vaelor');
});
test('alineación para Game: jugador primero con hechizos/set/runas, 4 bots con posición y 5 rivales con posición', () => {
  const sel = SEL.crearSeleccion({ rand: rng(8), jugadorPos: 'jungle' }); SEL.elegirCampeon(sel, 'rakhar');
  const l = SEL.alineacion(sel, { summoners: ['flash', 'smite'], itemSet: ['a', 'b', 'c', 'd', 'e', 'f'], runes: { key: 'tormenta_rapida', minors: [], secondary: null } });
  assert.equal(l[0].length, 5); assert.equal(l[1].length, 5);
  assert.equal(l[0][0].id, 'rakhar'); assert.equal(l[0][0].role, 'jungle'); assert.deepEqual(l[0][0].summoners, ['flash', 'smite']); assert.equal(l[0][0].itemSet.length, 6);
  assert.deepEqual(l[0].map(e => e.role).sort(), ['bot', 'jungle', 'mid', 'support', 'top']);
  assert.deepEqual(l[1].map(e => e.role), ['top', 'jungle', 'mid', 'bot', 'support']);
});
