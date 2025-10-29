document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "monitor") {
    alert("Acesso restrito a monitores!");
    window.location.href = "../index.html";
    return;
  }

  const selectAtividade = document.getElementById("selectAtividade");
  const formSelecionar = document.getElementById("formSelecionar");
  const listaPresencas = document.getElementById("listaPresencas");
  const btnGuardar = document.getElementById("btnGuardar");

  // 🔹 Carregar lista de atividades existentes
  const atividades = await getAll("atividades");
  atividades.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.titulo;
    selectAtividade.appendChild(opt);
  });

  // 🔹 Quando o monitor clicar em "Carregar lista"
  formSelecionar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idAtividade = Number(selectAtividade.value);
    const data = document.getElementById("dataPresenca").value;
    if (!idAtividade || !data) {
      alert("Selecione uma atividade e uma data!");
      return;
    }

    const inscricoes = (await getAll("inscricoes"))
      .filter(i => i.idAtividade === idAtividade && i.estado === "Confirmada");
    const criancas = await getAll("criancas");

    if (inscricoes.length === 0) {
      listaPresencas.innerHTML = `<tr><td colspan="3" style="text-align:center;">Nenhuma criança confirmada nesta atividade.</td></tr>`;
      btnGuardar.disabled = true;
      return;
    }

    listaPresencas.innerHTML = inscricoes.map(i => {
      const crianca = criancas.find(c => c.id === i.idCrianca);
      return `
        <tr data-id="${i.idCrianca}">
          <td>${crianca?.nome || "—"}</td>
          <td><input type="checkbox" class="chk-presente"></td>
          <td><input type="text" class="obs" placeholder="Ex: saiu às 16h"></td>
        </tr>
      `;
    }).join("");

    btnGuardar.disabled = false;
  });

  // 🔹 Guardar presenças
  btnGuardar.addEventListener("click", async () => {
    const idAtividade = Number(selectAtividade.value);
    const data = document.getElementById("dataPresenca").value;
    const linhas = listaPresencas.querySelectorAll("tr[data-id]");

    if (!idAtividade || linhas.length === 0) {
      alert("Nenhuma lista carregada!");
      return;
    }

    for (const tr of linhas) {
      const idCrianca = Number(tr.dataset.id);
      const presente = tr.querySelector(".chk-presente").checked;
      const observacoes = tr.querySelector(".obs").value.trim();

      const presenca = {
        idAtividade,
        idCrianca,
        data,
        presente,
        observacoes,
        registadoPor: userSessao.nome
      };

      await addItem("presencas", presenca);
    }

    alert("Presenças guardadas com sucesso!");
    listaPresencas.innerHTML = `<tr><td colspan="3" style="text-align:center;">Selecione uma atividade e data acima.</td></tr>`;
    btnGuardar.disabled = true;
    formSelecionar.reset();
  });
});
