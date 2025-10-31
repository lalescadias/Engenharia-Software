document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "encarregado") {
    alert("Acesso restrito a encarregados!");
    window.location.href = "../index.html";
    return;
  }

  const selectCrianca = document.getElementById("selectCrianca");
  const selectAtividade = document.getElementById("selectAtividade");
  const dataInicio = document.getElementById("dataInicio");
  const dataFim = document.getElementById("dataFim");
  const form = document.getElementById("formFiltro");
  const lista = document.getElementById("listaPresencas");

  let todasAtividades = [];
  let todasPresencas = [];
  let todasCriancas = [];

  // --- Carrega dados iniciais ---
  async function carregarFiltros() {
    todasAtividades = await getAll("atividades");
    todasPresencas = await getAll("presencas");
    todasCriancas = (await getAll("criancas")).filter(c => c.idEncarregado === userSessao.id);

    // Crianças do encarregado
    selectCrianca.innerHTML = `<option value="">Selecione...</option>`;
    todasCriancas.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nome;
      selectCrianca.appendChild(opt);
    });

    // Atividades (todas)
    selectAtividade.innerHTML = `<option value="">Todas</option>`;
    todasAtividades.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.titulo;
      selectAtividade.appendChild(opt);
    });
  }

  // --- Consultar ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idCrianca = Number(selectCrianca.value);
    const idAtividade = selectAtividade.value ? Number(selectAtividade.value) : null;
    const de = dataInicio.value ? new Date(dataInicio.value) : null;
    const ate = dataFim.value ? new Date(dataFim.value) : null;

    if (!idCrianca) return alert("Selecione uma criança!");

    const filtradas = todasPresencas.filter(p => {
      if (p.idCrianca !== idCrianca) return false;
      if (idAtividade && p.idAtividade !== idAtividade) return false;
      const dataP = new Date(p.data);
      if (de && dataP < de) return false;
      if (ate && dataP > ate) return false;
      return true;
    });

    lista.innerHTML = "";

    if (!filtradas.length) {
      lista.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhuma presença encontrada.</td></tr>`;
      return;
    }

    filtradas.sort((a, b) => new Date(a.data) - new Date(b.data));

    filtradas.forEach(p => {
      const atividade = todasAtividades.find(a => a.id === p.idAtividade);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(p.data).toLocaleDateString("pt-PT")}</td>
        <td>${atividade ? atividade.titulo : "—"}</td>
        <td style="text-align:center;">${p.presente ? "✔️" : "❌"}</td>
        <td>${p.presente ? (atividade?.horaEntrada || "09:00") : "—"}</td>
        <td>${p.presente ? (atividade?.horaSaida || "17:00") : "—"}</td>
        <td>${p.observacoes || "—"}</td>
      `;
      lista.appendChild(tr);
    });
  });

  await carregarFiltros();
});
