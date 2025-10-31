// scripts/presencas_monitor.js
document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // Segurança de sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "monitor") {
    alert("Acesso restrito a monitores!");
    window.location.href = "../index.html";
    return;
  }

  // Referências HTML
  const selectAtividade = document.getElementById("selectAtividade");
  const dataPresenca = document.getElementById("dataPresenca");
  const lista = document.getElementById("listaPresencas");
  const btnGuardar = document.getElementById("btnGuardar");
  const formSelecionar = document.getElementById("formSelecionar");

  let atividadesDoMonitor = [];
  let inscricoesAtuais = [];

  // Carregar atividades do monitor
  async function carregarAtividades() {
    const todas = await getAll("atividades");
    atividadesDoMonitor = todas.filter(a => a.idMonitor === userSessao.id);

    selectAtividade.innerHTML = `<option value="">Selecione...</option>`;
    atividadesDoMonitor.forEach(a => {
      const opt = document.createElement("option");
      const inicio = new Date(a.dataInicio).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short"
      });
      const fim = new Date(a.dataFim).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short"
      });
      opt.value = a.id;
      opt.textContent = `${a.titulo} (${inicio} – ${fim})`;
      selectAtividade.appendChild(opt);
    });
  }

  // Carregar lista de presenças
  async function carregarLista(idAtividade, data) {
    lista.innerHTML = "";
    btnGuardar.disabled = true;

    const inscricoes = await getAll("inscricoes");
    const criancas = await getAll("criancas");

    // filtra inscrições confirmadas para essa atividade
    const inscritas = inscricoes.filter(
      i => i.idAtividade === idAtividade && i.estado === "Confirmada"
    );

    if (!inscritas.length) {
      lista.innerHTML =
        `<tr><td colspan="3" style="text-align:center;">Nenhuma criança confirmada nesta atividade.</td></tr>`;
      return;
    }

    // guarda referência atual
    inscricoesAtuais = inscritas;

    // busca presenças já registadas para essa data
    const presencas = await getAll("presencas");
    const presencasDia = presencas.filter(
      p => p.idAtividade === idAtividade && p.data === data
    );

    inscritas.forEach(i => {
      const crianca = criancas.find(c => c.id === i.idCrianca);
      const nomeCrianca = crianca ? crianca.nome : `#${i.idCrianca}`;
      const presencaExistente = presencasDia.find(p => p.idCrianca === i.idCrianca);

      const tr = document.createElement("tr");
      tr.dataset.idCrianca = i.idCrianca;
      tr.innerHTML = `
        <td>${nomeCrianca}</td>
        <td><input type="checkbox" class="checkPresente" ${presencaExistente?.presente ? "checked" : ""}></td>
        <td><input type="text" class="obs" placeholder="Ex: saiu às 16h" value="${presencaExistente?.observacoes || ""}"></td>
      `;
      lista.appendChild(tr);
    });

    btnGuardar.disabled = false;
  }

  // Ao selecionar atividade + data
  formSelecionar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idAtividade = Number(selectAtividade.value);
    const data = dataPresenca.value;

    if (!idAtividade || !data) {
      alert("Selecione uma atividade e uma data!");
      return;
    }

    await carregarLista(idAtividade, data);
  });

  // Guardar presenças
  btnGuardar.addEventListener("click", async () => {
    const idAtividade = Number(selectAtividade.value);
    const data = dataPresenca.value;

    if (!idAtividade || !data) {
      alert("Selecione uma atividade e data antes de guardar!");
      return;
    }

    const linhas = [...lista.querySelectorAll("tr")];
    const registos = linhas.map(tr => ({
      idAtividade,
      idCrianca: Number(tr.dataset.idCrianca),
      data,
      presente: tr.querySelector(".checkPresente").checked,
      observacoes: tr.querySelector(".obs").value.trim()
    }));

    // elimina presenças antigas do mesmo dia/atividade antes de gravar novamente
    const todasPresencas = await getAll("presencas");
    const restantes = todasPresencas.filter(
      p => !(p.idAtividade === idAtividade && p.data === data)
    );

    const tx = db.transaction(["presencas"], "readwrite");
    const store = tx.objectStore("presencas");

    // limpa as antigas desse dia/atividade
    restantes.forEach(p => store.put(p));
    // adiciona as novas
    registos.forEach(r => store.add(r));

    tx.oncomplete = () => alert("Presenças guardadas com sucesso!");
    tx.onerror = () => alert("Erro ao guardar presenças.");
  });

  // Inicialização
  await carregarAtividades();
});
