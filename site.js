const money = value => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value) || 0);
const num = (id, fallback = 0) => Number(document.getElementById(id)?.value) || fallback;
const byId = id => document.getElementById(id);
const companyName = () => document.body.dataset.companyName || document.title.split('|')[0].trim();

function toast(message) {
  const el = byId('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-links');
function setNavOpen(open) {
  navMenu?.classList.toggle('open', open);
  navToggle?.setAttribute('aria-expanded', String(open));
  navToggle?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
navToggle?.addEventListener('click', () => setNavOpen(!navMenu?.classList.contains('open')));
document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => setNavOpen(false)));

document.querySelectorAll('[data-tool-target]').forEach(button => {
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', button.dataset.toolTarget);
  button.setAttribute('aria-selected', String(button.classList.contains('active')));
  button.addEventListener('click', () => {
    const target = button.dataset.toolTarget;
    document.querySelectorAll('[data-tool-target]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tool-pane').forEach(pane => pane.classList.toggle('active', pane.id === target));
  });
});
document.querySelectorAll('.tool-pane').forEach(pane => pane.setAttribute('role', 'tabpanel'));

function calcElectrical() {
  if (!byId('electrical-quote')) return;
  const labour = num('labour-hours') * num('labour-rate');
  const materials = num('material-cost') * (1 + num('material-markup') / 100);
  const prelims = num('travel-cost') + num('plant-cost') + num('compliance-cost');
  const base = labour + materials + prelims;
  const contingency = base * num('contingency') / 100;
  const subtotal = base + contingency;
  const gst = subtotal * .1;
  byId('electrical-labour').textContent = money(labour);
  byId('electrical-materials').textContent = money(materials);
  byId('electrical-total').textContent = money(subtotal + gst);
  byId('electrical-breakdown').textContent = `Subtotal ${money(subtotal)} + GST ${money(gst)}. Budget guide only; final price follows scope review and site inspection.`;
  window.currentEstimate = `${companyName().toUpperCase()} — ELECTRICAL BUDGET ESTIMATE\nLabour: ${money(labour)}\nMaterials incl. markup: ${money(materials)}\nTravel/plant/compliance: ${money(prelims)}\nContingency: ${money(contingency)}\nSubtotal: ${money(subtotal)}\nGST: ${money(gst)}\nTOTAL: ${money(subtotal + gst)}\n\nThis is a planning estimate, not a binding quotation.`;
}

function calcVoltageDrop() {
  if (!byId('voltage-drop')) return;
  const current = num('vd-current');
  const length = num('vd-length');
  const mv = num('vd-factor');
  const phases = byId('vd-phase')?.value || 'single';
  const supply = num('vd-supply', phases === 'three' ? 400 : 230);
  const factor = phases === 'three' ? Math.sqrt(3) : 2;
  const drop = factor * length * current * mv / 1000;
  const percent = supply ? drop / supply * 100 : 0;
  byId('vd-volts').textContent = `${drop.toFixed(2)} V`;
  byId('vd-percent').textContent = `${percent.toFixed(2)}%`;
  byId('vd-status').textContent = percent <= 5 ? 'Within 5%' : 'Review design';
  byId('vd-status').style.color = percent <= 5 ? '#72e2a7' : '#ff8b81';
}

function calcPower() {
  if (!byId('power-calc')) return;
  const volts = num('power-volts');
  const amps = num('power-amps');
  const pf = num('power-pf', 1);
  const phase = byId('power-phase')?.value || 'single';
  const watts = volts * amps * pf * (phase === 'three' ? Math.sqrt(3) : 1);
  byId('power-kw').textContent = `${(watts / 1000).toFixed(2)} kW`;
  byId('power-kva').textContent = `${(watts / Math.max(pf, .01) / 1000).toFixed(2)} kVA`;
  byId('power-energy').textContent = `${(watts / 1000 * num('power-hours', 1)).toFixed(1)} kWh`;
}

function calcAircon() {
  if (!byId('aircon-calc')) return;
  const area = num('room-length') * num('room-width');
  const heightFactor = num('room-height', 2.4) / 2.4;
  const exposure = num('room-exposure', 1);
  const occupancy = Math.max(0, num('room-people') - 2) * .12;
  const kw = Math.max(2, area * .15 * heightFactor * exposure + occupancy);
  byId('aircon-area').textContent = `${area.toFixed(1)} m²`;
  byId('aircon-kw').textContent = `${kw.toFixed(1)} kW`;
  byId('aircon-size').textContent = kw <= 2.8 ? '2.5–3.5 kW' : kw <= 5.5 ? '5–6 kW' : kw <= 8 ? '7–8 kW' : 'Multi/ducted review';
}

function calcConcrete() {
  if (!byId('concrete-calc')) return;
  const length = num('slab-length');
  const width = num('slab-width');
  const depthM = num('slab-depth') / 1000;
  const waste = 1 + num('concrete-waste') / 100;
  const area = length * width;
  const volume = area * depthM * waste;
  const trucks = Math.ceil(volume / Math.max(num('truck-capacity', 6), .1));
  const meshSheets = Math.ceil(area / 11.52 * 1.1);
  byId('concrete-area').textContent = `${area.toFixed(1)} m²`;
  byId('concrete-volume').textContent = `${volume.toFixed(2)} m³`;
  byId('concrete-trucks').textContent = `${trucks} load${trucks === 1 ? '' : 's'}`;
  byId('concrete-mesh').textContent = `${meshSheets} sheet${meshSheets === 1 ? '' : 's'} (estimate)`;
}

function calcExcavation() {
  if (!byId('excavation-calc')) return;
  const bank = num('exc-length') * num('exc-width') * num('exc-depth');
  const loose = bank * num('swell-factor', 1.25);
  const truck = num('tipper-capacity', 10);
  byId('exc-bank').textContent = `${bank.toFixed(1)} m³`;
  byId('exc-loose').textContent = `${loose.toFixed(1)} m³`;
  byId('exc-loads').textContent = `${Math.ceil(loose / Math.max(truck, .1))} loads`;
}

function calcAggregate() {
  if (!byId('aggregate-calc')) return;
  const area = num('agg-length') * num('agg-width');
  const compacted = area * num('agg-depth') / 1000;
  const loose = compacted * num('agg-compaction', 1.25);
  const tonnes = loose * num('agg-density', 1.8);
  byId('agg-area').textContent = `${area.toFixed(1)} m²`;
  byId('agg-volume').textContent = `${loose.toFixed(2)} m³ loose`;
  byId('agg-tonnes').textContent = `${tonnes.toFixed(1)} t`;
}

function calcGrade() {
  if (!byId('grade-calc')) return;
  const run = num('grade-run');
  const fall = num('grade-fall');
  const percent = run ? fall / (run * 1000) * 100 : 0;
  const ratio = fall ? run * 1000 / fall : 0;
  byId('grade-percent').textContent = `${percent.toFixed(2)}%`;
  byId('grade-ratio').textContent = ratio ? `1 in ${ratio.toFixed(1)}` : '—';
  byId('grade-mm').textContent = run ? `${(fall / run).toFixed(1)} mm/m` : '—';
}

function calcCivilQuote() {
  if (!byId('civil-quote')) return;
  const area = num('civil-length') * num('civil-width');
  const volume = area * num('civil-depth') / 1000 * (1 + num('civil-waste') / 100);
  const concrete = volume * num('concrete-rate');
  const prep = area * num('prep-rate');
  const reo = area * num('reo-rate');
  const labour = num('civil-crew-hours') * num('civil-crew-rate');
  const plant = num('civil-plant');
  const base = concrete + prep + reo + labour + plant;
  const margin = base * num('civil-margin') / 100;
  const subtotal = base + margin;
  const gst = subtotal * .1;
  byId('civil-volume').textContent = `${volume.toFixed(2)} m³`;
  byId('civil-direct').textContent = money(base);
  byId('civil-total').textContent = money(subtotal + gst);
  byId('civil-breakdown').textContent = `Concrete ${money(concrete)} · prep/formwork ${money(prep)} · reinforcement ${money(reo)} · labour ${money(labour)} · plant ${money(plant)} · margin ${money(margin)} · GST ${money(gst)}.`;
  window.currentEstimate = `${companyName().toUpperCase()} — CIVIL BUDGET ESTIMATE\nArea: ${area.toFixed(1)} m²\nConcrete: ${volume.toFixed(2)} m³ (${money(concrete)})\nPreparation/formwork: ${money(prep)}\nReinforcement: ${money(reo)}\nCrew: ${money(labour)}\nPlant/haulage: ${money(plant)}\nMargin: ${money(margin)}\nGST: ${money(gst)}\nTOTAL: ${money(subtotal + gst)}\n\nPlanning estimate only. Final quote requires drawings/specification and site inspection.`;
}

function getScopeText() {
  const form = byId('scope-form');
  if (!form) return window.currentEstimate || '';
  const data = new FormData(form);
  const lines = [`${document.title.toUpperCase()} — QUOTE REQUEST`, ''];
  for (const [key, value] of data.entries()) if (String(value).trim()) lines.push(`${key}: ${value}`);
  if (window.currentEstimate) lines.push('', window.currentEstimate);
  return lines.join('\n');
}

document.querySelectorAll('[data-copy-estimate]').forEach(button => button.addEventListener('click', async () => {
  const text = getScopeText();
  try { await navigator.clipboard.writeText(text); toast('Estimate copied'); }
  catch { toast('Select and copy from the printed estimate'); }
}));

document.querySelectorAll('[data-download-estimate]').forEach(button => button.addEventListener('click', () => {
  const blob = new Blob([getScopeText()], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${document.body.dataset.company || 'quote'}-estimate.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast('Estimate downloaded');
}));

byId('scope-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const email = event.currentTarget.dataset.email;
  const subject = encodeURIComponent(`${document.body.dataset.company || 'Project'} quote request`);
  const body = encodeURIComponent(getScopeText());
  if (email) window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  else { navigator.clipboard?.writeText(getScopeText()); toast('Quote brief copied — send it to the contractor'); }
});

const calculators = [calcElectrical, calcVoltageDrop, calcPower, calcAircon, calcConcrete, calcExcavation, calcAggregate, calcGrade, calcCivilQuote];
document.addEventListener('input', () => calculators.forEach(fn => fn()));
document.addEventListener('change', () => calculators.forEach(fn => fn()));
calculators.forEach(fn => fn());

document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
