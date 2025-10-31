document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // Verifica sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    alert("Acesso restrito a administradores!");
    window.location.href = "../index.html";
    return;
  }

  const lista = document.getElementById("listaCriancas");

  async function carregarCriancas() {
    const criancas = await getAll("criancas");

    lista.innerHTML = "";

    if (criancas.length === 0) {
      lista.innerHTML = `<tr><td colspan="3" style="text-align:center;">Nenhuma criança registada.</td></tr>`;
      return;
    }

    criancas.forEach(c => {
      // Calcular idade se tiver data de nascimento
      let idade = "—";
      if (c.dataNascimento) {
        const nasc = new Date(c.dataNascimento);
        const hoje = new Date();
        idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${idade}</td>
        <td><button class="btn btn-destaque" data-id="${c.id}">Ver detalhe</button></td>
      `;
      lista.appendChild(tr);
    });
  }

  // Clique no botão “Ver detalhe”
  lista.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const id = btn.dataset.id;
    window.location.href = `detalhes_crianca.html?id=${id}`;
  });

  await carregarCriancas();
});
