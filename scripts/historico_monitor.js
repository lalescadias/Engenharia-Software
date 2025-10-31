document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // Segurança de sessão

  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "monitor") {
    alert("Acesso restrito a monitores!");
    window.location.href = "../index.html";
    return;
  }

  const form = document.querySelector("form");
  const selectAtividade = form.querySelector("select");
  const inputDe = form.querySelectorAll('input[type="date"]')[0];
  const inputAte = form.querySelectorAll('input[type="date"]')[1];
  const tbody = document.querySelector("tbody");


  let atividadesMonitor = [];

  // Carregar atividades do monitor
  async function carregarAtividades() {
    const atividades = await getAll("atividades");
    atividadesMonitor = atividades.filter(a => a.idMonitor === userSessao.id);

    selectAtividade.innerHTML = `<option value="">Selecione uma atividade</option>`;
    atividadesMonitor.forEach(a => {
      const inicio = new Date(a.dataInicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
      const fim = new Date(a.dataFim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${a.titulo} (${inicio}–${fim})`;
      selectAtividade.appendChild(opt);
    });
  }

  // Consultar histórico
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idAtividade = Number(selectAtividade.value);
    const dataDe = inputDe.value ? new Date(inputDe.value) : null;
    const dataAte = inputAte.value ? new Date(inputAte.value) : null;

    if (!idAtividade) {
      alert("Selecione uma atividade!");
      return;
    }

    const presencas = await getAll("presencas");
    const criancas = await getAll("criancas");
    const atividades = await getAll("atividades");

    // Filtra pelas condições
    const listaFiltrada = presencas.filter(p => {
      if (p.idAtividade !== idAtividade) return false;
      const dataP = new Date(p.data);
      if (dataDe && dataP < dataDe) return false;
      if (dataAte && dataP > dataAte) return false;
      return true;
    });

    tbody.innerHTML = "";

    if (!listaFiltrada.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhuma presença registada neste período.</td></tr>`;
      return;
    }

    listaFiltrada.sort((a, b) => new Date(a.data) - new Date(b.data));

    listaFiltrada.forEach(p => {
      const crianca = criancas.find(c => c.id === p.idCrianca);
      const nomeCrianca = crianca ? crianca.nome : `#${p.idCrianca}`;
      const atividade = atividades.find(a => a.id === p.idAtividade);
      const horaEntrada = atividade?.horaEntrada || "—";
      const horaSaida = atividade?.horaSaida || "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(p.data).toLocaleDateString("pt-PT")}</td>
        <td>${nomeCrianca}</td>
        <td style="text-align:center;">${p.presente ? "<span style='color:green;'>✔️</span>" : "<span style='color:red;'>❌</span>"}</td>
        <td>${p.presente ? horaEntrada : "—"}</td>
        <td>${p.presente ? horaSaida : "—"}</td>
        <td>${p.observacoes || "—"}</td>
      `;
      tbody.appendChild(tr);
    });
  });

  await carregarAtividades();
});
