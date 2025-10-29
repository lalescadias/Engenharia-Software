document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "encarregado") {
    alert("Acesso restrito a encarregados!");
    window.location.href = "../index.html";
    return;
  }

  const lista = document.getElementById("listaInscricoes");

  async function renderInscricoes() {
    const inscricoes = await getAll("inscricoes");
    const criancas = await getAll("criancas");
    const atividades = await getAll("atividades");

    // filtra apenas as inscrições das crianças deste encarregado
    const minhasInscricoes = inscricoes.filter((i) =>
      criancas.some((c) => c.id === i.idCrianca && c.idEncarregado === userSessao.id)
    );

    lista.innerHTML = "";

    if (minhasInscricoes.length === 0) {
      lista.innerHTML = `<tr><td colspan="6" style="text-align:center;">Sem inscrições registadas.</td></tr>`;
      return;
    }

    minhasInscricoes.forEach((i) => {
      const crianca = criancas.find((c) => c.id === i.idCrianca);
      const atividade = atividades.find((a) => a.id === i.idAtividade);

      const nomeCrianca = crianca?.nome || "—";
      const nomeAtividade = atividade?.titulo || "—";

      const dataInicio = atividade?.dataInicio
        ? new Date(atividade.dataInicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
        : "";
      const dataFim = atividade?.dataFim
        ? new Date(atividade.dataFim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
        : "";
      const periodo = `${dataInicio} – ${dataFim}`;
      const dataPedido = new Date(i.dataInscricao).toLocaleDateString("pt-PT");

      let estadoClasse = "estado-pendente";
      if (i.estado === "Confirmada") estadoClasse = "estado-confirmada";
      if (i.estado === "Cancelada") estadoClasse = "estado-cancelada";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${nomeCrianca}</td>
        <td>${nomeAtividade}</td>
        <td>${periodo}</td>
        <td><span class="etiqueta ${estadoClasse}">${i.estado}</span></td>
        <td>${dataPedido}</td>
        <td>${
          i.estado === "Pendente"
            ? `<button class="btn btn-perigo cancelar">Cancelar</button>`
            : i.estado === "Confirmada"
            ? `<button class="btn btn-destaque">Ver detalhes</button>`
            : "—"
        }</td>
      `;

      if (i.estado === "Pendente") {
        tr.querySelector(".cancelar").onclick = async () => {
          if (!confirm("Deseja cancelar esta inscrição?")) return;
          const dbx = await dbReady;
          const tx = dbx.transaction("inscricoes", "readwrite");
          const store = tx.objectStore("inscricoes");
          i.estado = "Cancelada";
          store.put(i);
          renderInscricoes();
        };
      }

      lista.appendChild(tr);
    });
  }

  await renderInscricoes();
});
