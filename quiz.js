const storageKey = "quiz-planejamento-empreendedorismo-v1";
let data;
let state = { answers: {}, confirmed: {}, section: "revisao", index: 0 };
try { state = { ...state, ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; } catch {}

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[char]);
const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
const currentSection = () => data.sections.find(s => s.id === state.section) || data.sections[0];
const answered = q => q.options && Object.keys(q.options).length ? Boolean(state.answers[q.id]) : Boolean((state.answers[q.id] || "").trim());
const complete = q => q.options && Object.keys(q.options).length ? Boolean(state.confirmed[q.id]) : answered(q);

function setLocation(section, index) {
  state.section = section;
  state.index = index;
  save();
  history.replaceState(null, "", `#${section}/${index + 1}`);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderSidebar() {
  document.getElementById("sections").innerHTML = data.sections.map(s => {
    const done = s.questions.filter(complete).length;
    return `<button type="button" class="section-btn ${s.id === state.section ? "active" : ""}" data-section="${s.id}" aria-current="${s.id === state.section ? "page" : "false"}"><span class="section-name">${escapeHtml(s.label)}</span><span class="section-meta">${s.id === "revisao" ? escapeHtml(s.detail) : `${done}/${s.questions.length} concluídas`}</span></button>`;
  }).join("");
  document.querySelectorAll("[data-section]").forEach(el => el.addEventListener("click", () => setLocation(el.dataset.section, 0)));
}

function renderGuide() {
  document.getElementById("main").innerHTML = `
    <p class="eyebrow">Guia rápido</p>
    <h1 class="heading">Uma visão da matéria</h1>
    <p class="guide-intro">Os materiais percorrem cinco ideias: definir o rumo da organização, analisar o ambiente, desenhar o negócio, acompanhar a estratégia e agir com postura empreendedora. Este guia resume os conceitos; os enunciados originais estão nas abas de questões.</p>
    <div class="guide-grid">
      <section class="guide-card"><span class="guide-number">01</span><h2>Planejamento estratégico</h2><p>Define objetivos de longo prazo e as estratégias para alcançá-los.</p><ul><li><strong>Missão:</strong> propósito e razão de existir da organização.</li><li><strong>Visão:</strong> destino futuro desejado.</li><li><strong>Objetivos estratégicos:</strong> resultados amplos de longo prazo; <strong>metas operacionais:</strong> execução de tarefas e resultados mais próximos.</li></ul></section>
      <section class="guide-card"><span class="guide-number">02</span><h2>Análise SWOT</h2><p>Organiza o diagnóstico em quatro quadrantes para apoiar decisões.</p><div class="mini-grid"><div><strong>Ambiente interno</strong><span>Forças e fraquezas</span></div><div><strong>Ambiente externo</strong><span>Oportunidades e ameaças</span></div></div><p>As oportunidades e ameaças vêm de fatores que a organização não controla diretamente.</p></section>
      <section class="guide-card"><span class="guide-number">03</span><h2>Business Model Canvas</h2><p>Mostra em um quadro como o negócio cria, entrega e captura valor.</p><ul><li><strong>Clientes e valor:</strong> segmentos, proposta de valor, canais e relacionamento.</li><li><strong>Operação:</strong> recursos, atividades e parcerias-chave.</li><li><strong>Viabilidade:</strong> estrutura de custos e fluxo de receitas.</li></ul></section>
      <section class="guide-card"><span class="guide-number">04</span><h2>Estratégia e indicadores</h2><p>As questões também abordam formas de competir e acompanhar a execução.</p><ul><li><strong>Porter:</strong> liderança em custos, diferenciação e foco.</li><li><strong>Ansoff:</strong> desenvolver produto é ampliar a oferta com um produto novo no mercado em que a empresa já atua.</li><li><strong>BSC:</strong> perspectivas financeira, clientes, processos internos, aprendizado e crescimento.</li></ul></section>
      <section class="guide-card guide-card-wide"><span class="guide-number">05</span><h2>Comportamento empreendedor</h2><p>Envolve identificar oportunidades, inovar, planejar e avaliar riscos. O intraempreendedor usa essas características dentro de uma organização, buscando melhorias e resultados. As questões diferenciam essa postura do empreendedorismo iniciado por necessidade.</p></section>
    </div>
    <div class="guide-end"><p>Pronto para praticar? Comece pelo simulado ou escolha um tema no menu.</p><button type="button" class="btn primary" id="start-quiz">Abrir o simulado</button></div>`;
  renderSidebar();
  document.getElementById("start-quiz").addEventListener("click", () => setLocation("simulado", 0));
}

function render() {
  const section = currentSection();
  if (section.id !== state.section) { state.section = section.id; state.index = 0; history.replaceState(null, "", `#${section.id}/1`); save(); }
  if (section.id === "revisao") { renderGuide(); return; }
  state.index = Math.max(0, Math.min(section.questions.length - 1, Number(state.index) || 0));
  const q = section.questions[state.index];
  const selected = state.answers[q.id] || "";
  const checked = Boolean(state.confirmed[q.id]);
  const subjective = !Object.keys(q.options).length;
  const count = section.questions.filter(complete).length;
  const options = Object.entries(q.options).map(([key, value]) => {
    const classes = ["option", selected === key ? "selected" : "", checked && key === q.answer ? "correct" : "", checked && selected === key && selected !== q.answer ? "wrong" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${classes}" data-option="${key}" aria-pressed="${selected === key}"><span class="option-key">${key}</span><span class="option-text">${escapeHtml(value)}</span></button>`;
  }).join("");
  let feedback = "";
  if (checked && !subjective) {
    const right = selected === q.answer;
    feedback = `<div class="answer-box ${right ? "" : "incorrect"}" role="status"><strong>${right ? "Resposta correta" : "Resposta incorreta"}</strong><p>Gabarito de estudo: ${q.answer}) ${escapeHtml(q.options[q.answer])}</p></div>`;
  }
  const questionArea = subjective
    ? `<textarea class="text-answer" id="text-answer" aria-label="Sua resposta" placeholder="Escreva sua resposta aqui…">${escapeHtml(selected)}</textarea><p class="draft-note">Resposta salva automaticamente neste navegador. O PDF não apresenta correção para esta questão.</p>`
    : `<div class="options" role="group" aria-label="Alternativas">${options}</div>`;
  const info = `<p class="info-strip">As respostas das objetivas são um gabarito de estudo identificado pelo conteúdo. Os PDFs não apresentam gabarito explícito.</p>`;
  document.getElementById("main").innerHTML = `
    <div class="topline"><p class="eyebrow">${escapeHtml(section.label)}</p><span class="count">${count} de ${section.questions.length} concluídas</span></div>
    <h1 class="heading">${escapeHtml(section.label)}</h1><p class="source">Fonte: ${escapeHtml(section.source)}</p>
    <div class="progress-row"><div class="progress" role="progressbar" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${section.questions.length}" aria-label="Progresso"><span style="width:${count / section.questions.length * 100}%"></span></div><span class="progress-label">${Math.round(count / section.questions.length * 100)}%</span></div>
    ${info}
    <article class="question-card"><div class="q-kicker"><span>Questão ${q.number} de ${section.questions.length}</span><span class="q-type">${subjective ? "Discursiva" : "Objetiva"}</span></div>
      ${q.stem ? `<p class="question-text">${escapeHtml(q.stem)}</p>` : ""}
      ${q.id === "canvas-2" ? `<img class="figure" src="canvas-figura.png" alt="Figura original do Canvas com a numeração dos nove blocos" width="874" height="493"><p class="figure-caption">Figura da questão 2, extraída da página 24 do material.</p>` : ""}
      ${questionArea}${feedback}
      <div class="actions"><button class="btn" id="previous" ${state.index === 0 ? "disabled" : ""}>Anterior</button><span class="spacer"></span>${!subjective ? `<button class="btn primary" id="check" ${!selected ? "disabled" : ""}>${checked ? "Conferir novamente" : "Conferir resposta"}</button>` : ""}<button class="btn primary" id="next" ${state.index === section.questions.length - 1 ? "disabled" : ""}>Próxima</button></div>
    </article>
    <div class="jump-wrap"><p class="jump-title">Ir para a questão</p><div class="jump-list">${section.questions.map((item, i) => `<button class="jump ${i === state.index ? "current" : ""} ${complete(item) ? "done" : ""}" data-jump="${i}" aria-label="Questão ${i+1}" ${i === state.index ? 'aria-current="step"' : ""}>${i+1}</button>`).join("")}</div></div>`;
  renderSidebar();
  document.getElementById("previous").addEventListener("click", () => setLocation(section.id, state.index - 1));
  document.getElementById("next").addEventListener("click", () => setLocation(section.id, state.index + 1));
  document.querySelectorAll("[data-jump]").forEach(el => el.addEventListener("click", () => setLocation(section.id, Number(el.dataset.jump))));
  document.querySelectorAll("[data-option]").forEach(el => el.addEventListener("click", () => {
    state.answers[q.id] = el.dataset.option;
    delete state.confirmed[q.id];
    save(); render();
  }));
  const check = document.getElementById("check");
  if (check) check.addEventListener("click", () => { state.confirmed[q.id] = true; save(); render(); });
  const textarea = document.getElementById("text-answer");
  if (textarea) textarea.addEventListener("input", () => { state.answers[q.id] = textarea.value; save(); });
}

function applyHash() {
  const hash = location.hash.match(/^#([a-z]+)\/(\d+)$/);
  if (hash && data.sections.some(s => s.id === hash[1])) { state.section = hash[1]; state.index = Number(hash[2]) - 1; }
  else if (location.hash) { state.section = "revisao"; state.index = 0; history.replaceState(null, "", "#revisao/1"); }
  render();
}

fetch("questions.json").then(r => { if (!r.ok) throw new Error("Dados indisponíveis"); return r.json(); }).then(payload => {
  data = payload;
  applyHash();
  window.addEventListener("hashchange", applyHash);
}).catch(() => { document.getElementById("main").innerHTML = '<p class="loading">Não foi possível carregar as questões. Atualize a página para tentar novamente.</p>'; });
