document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    alert("Acesso restrito a administradores!");
    window.location.href = "../index.html";
    return;
  }

  const listaPendentes = document.getElementById("listaPendentes");
  const listaTodas = document.getElementById("listaTodas");

  async function renderInscricoes() {
    const inscricoes = await getAll("inscricoes");
    const criancas = await getAll("criancas");
    const atividades = await getAll("atividades");
    const utilizadores = await getAll("utilizadores");

    listaPendentes.innerHTML = "";
    listaTodas.innerHTML = "";

    if (inscricoes.length === 0) {
      listaPendentes.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhuma inscrição registada.</td></tr>`;
      listaTodas.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhuma inscrição registada.</td></tr>`;
      return;
    }

    inscricoes.forEach((i) => {
      const crianca = criancas.find((c) => c.id === i.idCrianca);
      const atividade = atividades.find((a) => a.id === i.idAtividade);
      const encarregado = utilizadores.find((u) => u.id === crianca?.idEncarregado);

      const nomeCrianca = crianca?.nome || "—";
      const nomeAtividade = atividade?.titulo || "—";
      const nomeEncarregado = encarregado?.nome || "—";
      const dataPedido = new Date(i.dataInscricao).toLocaleDateString("pt-PT");
      const inicio = atividade?.dataInicio ? new Date(atividade.dataInicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) : "-";
      const fim = atividade?.dataFim ? new Date(atividade.dataFim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) : "-";

      let estadoClasse = "estado-pendente";
      if (i.estado === "Confirmada") estadoClasse = "estado-confirmada";
      if (i.estado === "Cancelada") estadoClasse = "estado-cancelada";

      const linha = `
        <tr>
          <td>${dataPedido}</td>
          <td>${nomeCrianca}</td>
          <td>${nomeAtividade}</td>
          <td>${inicio} – ${fim}</td>
          <td><span class="etiqueta ${estadoClasse}">${i.estado}</span></td>
          <td>
            ${
              i.estado === "Pendente"
                ? `
                <button class="btn btn-primaria aprovar" data-id="${i.id}">Confirmar</button>
                <button class="btn btn-perigo rejeitar" data-id="${i.id}">Rejeitar</button>`
                : "—"
            }
          </td>
        </tr>
      `;

      // Adiciona à tabela certa
      if (i.estado === "Pendente") {
        listaPendentes.insertAdjacentHTML("beforeend", linha);
      }
      listaTodas.insertAdjacentHTML("beforeend", linha);
    });

    // Eventos
    document.querySelectorAll(".aprovar").forEach((btn) => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        await atualizarEstado(id, "Confirmada");
        renderInscricoes();
      };
    });

    document.querySelectorAll(".rejeitar").forEach((btn) => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        await atualizarEstado(id, "Cancelada");
        renderInscricoes();
      };
    });
  }

  async function atualizarEstado(id, novoEstado) {
    const tx = db.transaction("inscricoes", "readwrite");
    const store = tx.objectStore("inscricoes");

    const req = store.get(id);
    req.onsuccess = () => {
      const inscricao = req.result;
      if (!inscricao) return;
      inscricao.estado = novoEstado;
      store.put(inscricao);
    };
  }

  await renderInscricoes();
});
