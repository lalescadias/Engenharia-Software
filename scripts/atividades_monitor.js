// scripts/atividades_monitor.js
document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // Segurança de sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "monitor") {
    mostrarAlerta("Acesso restrito a monitores!", "erro");
    window.location.href = "../index.html";
    return;
  }

  const tbody = document.querySelector("tbody");

  //  Carrega atividades atribuídas 
  async function carregarAtividades() {
    const atividades = await getAll("atividades");
    const inscricoes = await getAll("inscricoes");

    const minhasAtividades = atividades.filter(a => a.idMonitor === userSessao.id);
    tbody.innerHTML = "";

    if (!minhasAtividades.length) {
      tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;">Nenhuma atividade atribuída.</td></tr>
      `;
      return;
    }

    minhasAtividades.forEach(a => {
      const inicio = new Date(a.dataInicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
      const fim = new Date(a.dataFim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });

      // Conta inscritos confirmados
      const inscritosConfirmados = inscricoes.filter(i => i.idAtividade === a.id && i.estado === "Confirmada").length;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.titulo}</td>
        <td>${inicio}–${fim} (${a.horaEntrada || "09:00"}–${a.horaSaida || "17:00"})</td>
        <td>${a.sala || "—"}</td>
        <td>${a.lotacao || "—"}</td>
        <td>${inscritosConfirmados}</td>
        <td><a class="btn btn-primaria" href="presencas.html">Marcar presenças</a></td>
      `;
      tbody.appendChild(tr);
    });
  }

  await carregarAtividades();
});
