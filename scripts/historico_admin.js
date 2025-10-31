document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // Sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    alert("Acesso restrito a administradores!");
    window.location.href = "../index.html";
    return;
  }

  // Referências
  const form = document.getElementById("formFiltros");
  const selectAtividade = document.getElementById("atividade");
  const selectMonitor = document.getElementById("monitor");
  const inputDe = document.getElementById("dataDe");
  const inputAte = document.getElementById("dataAte");
  const tbody = document.getElementById("listaPresencas");

  // Dados
  const atividades = await getAll("atividades");
  const utilizadores = await getAll("utilizadores");
  const presencas = await getAll("presencas");
  const criancas = await getAll("criancas");

  // preencher Filtros 
  function preencherFiltros() {
    // Atividades
    selectAtividade.innerHTML = `<option value="">Todas</option>`;
    atividades.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.titulo;
      selectAtividade.appendChild(opt);
    });

    // Monitores
    const monitores = utilizadores.filter(u => u.perfil === "monitor");
    selectMonitor.innerHTML = `<option value="">Todos</option>`;
    monitores.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.nome;
      selectMonitor.appendChild(opt);
    });
  }

  // Aplicar Filtros
  function aplicarFiltros() {
    const atividadeSelecionada = selectAtividade.value.trim();
    const monitorSelecionado = selectMonitor.value.trim();
    const de = inputDe.value ? new Date(inputDe.value) : null;
    const ate = inputAte.value ? new Date(inputAte.value) : null;

    let filtradas = [...presencas];

    // Filtro por atividade
    if (atividadeSelecionada) {
      filtradas = filtradas.filter(p => p.idAtividade == atividadeSelecionada);
    }

    // Filtro por monitor
    if (monitorSelecionado) {
      filtradas = filtradas.filter(p => {
        const atividade = atividades.find(a => a.id === p.idAtividade);
        return atividade && atividade.idMonitor == monitorSelecionado;
      });
    }

    // Filtro por data
    if (de || ate) {
      filtradas = filtradas.filter(p => {
        const dataP = new Date(p.data);
        if (de && dataP < de) return false;
        if (ate && dataP > ate) return false;
        return true;
      });
    }

    renderTabela(filtradas);
  }

  // Renderização
  function renderTabela(listaPresencas) {
    tbody.innerHTML = "";

    if (!listaPresencas.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Nenhuma presença encontrada.</td></tr>`;
      return;
    }

    listaPresencas.forEach(p => {
      const atividade = atividades.find(a => a.id === p.idAtividade);
      const monitor = utilizadores.find(u => u.id === atividade?.idMonitor);
      const crianca = criancas.find(c => c.id === p.idCrianca);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(p.data).toLocaleDateString("pt-PT")}</td>
        <td>${atividade?.titulo || "—"}</td>
        <td>${monitor?.nome || "—"}</td>
        <td>${crianca?.nome || "—"}</td>
        <td>${p.presente ? "<span style='color:green;'>✔️</span>" : "<span style='color:red;'>❌</span>"}</td>
        <td>${p.horaEntrada || "—"}</td>
        <td>${p.horaSaida || "—"}</td>
        <td>${p.observacoes || "—"}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Eventos
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    aplicarFiltros();
  });

  // Inicialização
  preencherFiltros();
  aplicarFiltros();
});
