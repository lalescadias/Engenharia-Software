document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  //  Segurança
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    mostrarAlerta("Acesso restrito a administradores!", "erro");
    window.location.href = "../index.html";
    return;
  }

  //  Referências
  const lista = document.getElementById("listaInscricoes");
  const filtroAtividade = document.getElementById("filtroAtividade");
  const filtroEstado = document.getElementById("filtroEstado");
  const filtroDe = document.getElementById("filtroDe");
  const filtroAte = document.getElementById("filtroAte");
  const formFiltros = document.getElementById("formFiltros");

  let todasInscricoes = [];
  let criancas = [];
  let atividades = [];
  let utilizadores = [];

  //  Carregar filtros
  async function carregarFiltros() {
    atividades = await getAll("atividades");
    filtroAtividade.innerHTML = `<option value="">Todas</option>`;
    atividades.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.titulo;
      filtroAtividade.appendChild(opt);
    });
  }

  //  Renderizar tabela
  async function renderTabela(filtradas) {
    lista.innerHTML = "";

    if (filtradas.length === 0) {
      lista.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhuma inscrição encontrada.</td></tr>`;
      return;
    }

    filtradas.forEach(i => {
      const crianca = criancas.find(c => c.id === i.idCrianca);
      const atividade = atividades.find(a => a.id === i.idAtividade);
      const encarregado = utilizadores.find(u => u.id === crianca?.idEncarregado);

      const inicio = atividade?.dataInicio ? new Date(atividade.dataInicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) : "-";
      const fim = atividade?.dataFim ? new Date(atividade.dataFim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) : "-";
      const dataPed = i.dataInscricao ? new Date(i.dataInscricao).toLocaleDateString("pt-PT") : "-";

      const estadoClasse =
        i.estado === "Confirmada" ? "estado-confirmada" :
        i.estado === "Cancelada" ? "estado-cancelada" : "estado-pendente";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dataPed}</td>
        <td>${crianca?.nome || "—"}</td>
        <td>${encarregado?.nome || "—"}</td>
        <td>${atividade?.titulo || "—"}</td>
        <td>${inicio} – ${fim}</td>
        <td><span class="etiqueta ${estadoClasse}">${i.estado}</span></td>
        <td>
          ${i.estado === "Pendente"
            ? `<button class="btn btn-primaria aprovar" data-id="${i.id}">Confirmar</button>
               <button class="btn btn-perigo rejeitar" data-id="${i.id}">Rejeitar</button>`
            : "—"}
        </td>
      `;
      lista.appendChild(tr);
    });

    // Eventos para aprovar/rejeitar
    document.querySelectorAll(".aprovar").forEach(btn => {
      btn.onclick = async () => {
        await atualizarEstado(Number(btn.dataset.id), "Confirmada");
        await carregarInscricoes();
      };
    });

    document.querySelectorAll(".rejeitar").forEach(btn => {
      btn.onclick = async () => {
        await atualizarEstado(Number(btn.dataset.id), "Cancelada");
        await carregarInscricoes();
      };
    });
  }

  //  Aplicar filtros
  function aplicarFiltros() {
    let filtradas = [...todasInscricoes];

    const idAtividade = filtroAtividade.value;
    const estado = filtroEstado.value;
    const de = filtroDe.value ? new Date(filtroDe.value) : null;
    const ate = filtroAte.value ? new Date(filtroAte.value) : null;

    if (idAtividade) filtradas = filtradas.filter(i => i.idAtividade == idAtividade);
    if (estado) filtradas = filtradas.filter(i => i.estado === estado);
    if (de) filtradas = filtradas.filter(i => new Date(i.dataInscricao) >= de);
    if (ate) filtradas = filtradas.filter(i => new Date(i.dataInscricao) <= ate);

    renderTabela(filtradas);
  }

  //  Atualizar estado
  async function atualizarEstado(id, novoEstado) {
    const tx = db.transaction(["inscricoes"], "readwrite");
    const store = tx.objectStore("inscricoes");
    const req = store.get(id);

    req.onsuccess = () => {
      const insc = req.result;
      if (!insc) return;
      insc.estado = novoEstado;
      store.put(insc);
    };
  }

  //  Carregar tudo
  async function carregarInscricoes() {
    todasInscricoes = await getAll("inscricoes");
    criancas = await getAll("criancas");
    atividades = await getAll("atividades");
    utilizadores = await getAll("utilizadores");

    aplicarFiltros();
  }

  //  Eventos
  formFiltros.addEventListener("submit", e => {
    e.preventDefault();
    aplicarFiltros();
  });

  //  Inicialização
  await carregarFiltros();
  await carregarInscricoes();
});
