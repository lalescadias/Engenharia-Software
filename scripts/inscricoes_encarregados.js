document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "encarregado") {
    alert("Acesso restrito a encarregados!");
    window.location.href = "../index.html";
    return;
  }

  const lista = document.getElementById("listaInscricoes");

  async function carregarInscricoes() {
    const inscricoes = await getAll("inscricoes");
    const criancas = (await getAll("criancas")).filter(c => c.idEncarregado === userSessao.id);
    const atividades = await getAll("atividades");

    // apenas as do encarregado logado
    const minhas = inscricoes.filter(i =>
      criancas.some(c => c.id === i.idCrianca)
    );

    lista.innerHTML = "";

    if (minhas.length === 0) {
      lista.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhuma inscrição encontrada.</td></tr>`;
      return;
    }

    minhas.forEach(i => {
      const crianca = criancas.find(c => c.id === i.idCrianca);
      const atividade = atividades.find(a => a.id === i.idAtividade);

      const dataPed = new Date(i.dataInscricao).toLocaleDateString("pt-PT");
      const inicio = new Date(atividade.dataInicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
      const fim = new Date(atividade.dataFim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });

      // Estado visual
      const etiqueta = {
        "Pendente": "estado-pendente",
        "Confirmada": "estado-confirmada",
        "Cancelada": "estado-cancelada"
      }[i.estado] || "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${crianca?.nome || "—"}</td>
        <td>${atividade?.titulo || "—"}</td>
        <td>${inicio} – ${fim}</td>
        <td><span class="etiqueta ${etiqueta}">${i.estado}</span></td>
        <td>${dataPed}</td>
        <td>
          ${i.estado === "Cancelada"
            ? "—"
            : `<button class="btn btn-perigo" data-id="${i.id}">Cancelar</button>`}
        </td>
      `;
      lista.appendChild(tr);
    });
  }

  // Evento de cancelamento
  // Evento de cancelamento
lista.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  if (!confirm("Tem certeza que deseja cancelar esta inscrição?")) return;

  // Obter a inscrição diretamente
  const inscricoes = await getAll("inscricoes");
  const insc = inscricoes.find(i => i.id === id);
  if (!insc) {
    alert("Inscrição não encontrada!");
    return;
  }

  // Atualiza os dados localmente
  insc.estado = "Cancelada";
  insc.dataCancelamento = new Date().toISOString();

  try {
    // Abre uma nova transação ativa para salvar
    const database = await dbReady;
    const tx = database.transaction(["inscricoes"], "readwrite");
    const store = tx.objectStore("inscricoes");

    await new Promise((resolve, reject) => {
      const req = store.put(insc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    alert("Inscrição cancelada com sucesso!");
    await carregarInscricoes();
  } catch (err) {
    console.error("Erro ao atualizar inscrição:", err);
    alert("Ocorreu um erro ao cancelar a inscrição.");
  }
});
  // Carregar inscrições ao iniciar
  await carregarInscricoes();

});
