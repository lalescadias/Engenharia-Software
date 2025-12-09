document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  //  Segurança de sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "encarregado") {
    mostrarAlerta("Acesso restrito a encarregados!", "erro");
    window.location.href = "../index.html";
    return;
  }

  const lista = document.getElementById("listaAtividades");

  async function carregarAtividades() {
    const atividades = await getAll("atividades");
    const criancas = (await getAll("criancas")).filter(c => c.idEncarregado === userSessao.id && c.ativa !== false);


    lista.innerHTML = "";

    if (atividades.length === 0) {
      lista.innerHTML = `<p style="grid-column:1/-1;text-align:center;">Nenhuma atividade disponível no momento.</p>`;
      return;
    }

    atividades.forEach((a) => {
      const inicio = new Date(a.dataInicio).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
      });
      const fim = new Date(a.dataFim).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
      });

      const card = document.createElement("article");
      card.className = "card";

      const imgUrl = a.imagem && a.imagem.trim() !== "" ? a.imagem : "https://picsum.photos/seed/atl/600/300";


      card.innerHTML = `
        <img src="${imgUrl}" alt="Imagem da atividade"
          style="width:100%;border-radius:12px;margin-bottom:10px">
        <h3>${a.titulo}</h3>
        <p class="kicker">${inicio} – ${fim} • ${a.sala} • Lotação ${a.lotacao}</p>
        <p>${a.descricao || "Sem descrição disponível."}</p>
        <form class="stack" data-id="${a.id}">
          <label>Criança</label>
          <select required>
            <option value="">Selecionar...</option>
            ${criancas.map(c => `<option value="${c.id}">${c.nome}</option>`).join("")}
          </select>
          <div class="actions"><button class="btn btn-primaria" type="submit">Inscrever</button></div>
        </form>
      `;

      // Inscrição direta
      const form = card.querySelector("form");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const idAtividade = Number(a.id);
        const idCrianca = Number(form.querySelector("select").value);
        if (!idCrianca) {
          mostrarAlerta("Selecione uma criança!", "erro");
          return;
        }

        const inscricoes = await getAll("inscricoes");
        const bloqueados = ["Pendente", "Confirmada"];

        const duplicada = inscricoes.some(
          i =>
            i.idCrianca === idCrianca &&
            i.idAtividade === idAtividade &&
            bloqueados.includes(i.estado)
        );

        if (duplicada) {
          mostrarAlerta("Esta criança já está inscrita nesta atividade!", "erro");
          return;
        }

        const nova = {
          idCrianca,
          idAtividade,
          dataInscricao: new Date().toISOString(),
          estado: "Pendente"
        };

        await addItem("inscricoes", nova);
        mostrarAlerta("Inscrição enviada com sucesso!", "sucesso");
      });

      lista.appendChild(card);
    });
  }

  await carregarAtividades();
});
