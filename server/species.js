'use strict';
/* Catálogo cerrado de especies y zonas: evita texto libre en los campos que alimentan alt, títulos y JSON-LD.
   `note` es el recordatorio legal que ve el moderador (Orden de 13/01/2023 y Decreto 205/2023). */
const SPECIES = [
  { id: 'black-bass', label: 'Black bass', guide: '/pesca-black-bass-andalucia.html', kind: 'continental', note: 'Exótica: solo en las áreas autorizadas; fuera de ellas no puede devolverse al agua.' },
  { id: 'carpa', f: true, label: 'Carpa', guide: '/carpfishing-andalucia.html', kind: 'continental', note: 'Exótica: solo en áreas autorizadas. Sin cebado.' },
  { id: 'barbo', label: 'Barbo ibérico', guide: '/pesca-del-barbo-iberico.html', kind: 'continental', note: 'Captura y suelta obligatoria. Periodo hábil: 1 julio – 25 febrero.' },
  { id: 'lucio', label: 'Lucio', guide: '/pesca-del-lucio-en-andalucia.html', kind: 'continental', note: 'Exótica: solo en los embalses autorizados.' },
  { id: 'trucha', f: true, label: 'Trucha', guide: '/pesca-a-mosca-truchas-andalucia.html', kind: 'continental', note: 'Solo 1 mayo – 15 octubre, en cotos y aguas trucheras, captura y suelta.' },
  { id: 'lubina', f: true, label: 'Lubina', guide: '/pesca-lubina-andalucia.html', kind: 'marina', note: 'Talla mínima (Reglamento UE 2019/1241). Marcado de la cola si se retiene.' },
  { id: 'dorada', f: true, label: 'Dorada', guide: '/pesca-dorada-andalucia.html', kind: 'marina', note: 'Talla mínima (Reglamento UE 2019/1241). Marcado de la cola si se retiene.' },
  { id: 'sargo', label: 'Sargo', guide: '/surfcasting-costa-andalucia.html', kind: 'marina', note: 'Talla mínima (Reglamento UE 2019/1241).' },
  { id: 'otra-continental', f: true, label: 'Otra especie de agua dulce', guide: '/normativa-pesca-continental-andalucia.html', kind: 'continental', note: 'Comprobar que no es especie prohibida (tenca, cacho, anguila) ni siluro devuelto vivo.' },
  { id: 'otra-marina', f: true, label: 'Otra especie marina', guide: '/surfcasting-costa-andalucia.html', kind: 'marina', note: 'Prohibidos pulpo, bivalvos, pez espada, caballitos de mar, rayas y tiburones del Anexo I.' }
];
const PROVINCES = ['Almería', 'Cádiz', 'Córdoba', 'Granada', 'Huelva', 'Jaén', 'Málaga', 'Sevilla', 'Otra (España)'];
const SPECIES_BY_ID = Object.fromEntries(SPECIES.map(s => [s.id, s]));
module.exports = { SPECIES, PROVINCES, SPECIES_BY_ID };
