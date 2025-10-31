document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // Segurança de sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    mostrarAlerta("Acesso restrito a administradores!", "erro");
    window.location.href = "../index.html";
    return;
  }

  const form = document.getElementById("formUtilizador");
  const lista = document.getElementById("listaUtilizadores");

  async function contarAdmins() {
    const todos = await getAll("utilizadores");
    return todos.filter(u => u.perfil === "admin").length;
  }

  async function renderUtilizadores() {
    const utilizadores = await getAll("utilizadores");
    lista.innerHTML = "";

    const filtrados = utilizadores.filter(u => u.perfil === "monitor" || u.perfil === "admin");

    if (filtrados.length === 0) {
      lista.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhum utilizador registado.</td></tr>`;
      return;
    }

    filtrados.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.nome}</td>
        <td style="text-transform:capitalize;">${u.perfil}</td>
        <td>
          <button class="btn btn-perigo" data-id="${u.id}" data-perfil="${u.perfil}">Remover</button>
        </td>
      `;
      lista.appendChild(tr);
    });

    lista.querySelectorAll(".btn-perigo").forEach((btn) => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const perfil = btn.dataset.perfil;
        const totalAdmins = await contarAdmins();

        // Impedir remoção de si próprio
        if (userSessao.id === id) {
          mostrarAlerta("Não pode remover o seu próprio utilizador!", "erro");
          return;
        }

        // Impedir apagar o último admin
        if (perfil === "admin" && totalAdmins <= 1) {
          mostrarAlerta("Não é possível remover o último administrador do sistema!", "erro");
          return;
        }

        const confirmar = await confirmarAcao("Tem a certeza que deseja remover este utilizador?", "erro");
        if (!confirmar) return;

        const tx = db.transaction("utilizadores", "readwrite");
        tx.objectStore("utilizadores").delete(id);
        await new Promise((r) => (tx.oncomplete = r));
        mostrarAlerta("Utilizador removido com sucesso!", "sucesso");
        renderUtilizadores();

      };
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const telemovel = document.getElementById("telemovel").value.trim();
    const morada = document.getElementById("morada").value.trim();
    const perfil = document.getElementById("perfil").value;
    const senha = document.getElementById("senha").value.trim();

    if (!["monitor", "admin"].includes(perfil)) {
      mostrarAlerta("Só é possível criar utilizadores do tipo 'monitor' ou 'admin'.", "erro");
      return;
    }

    const existente = await getByIndex("utilizadores", "email", email);
    if (existente) {
      mostrarAlerta("Já existe um utilizador com este email!", "erro");
      return;
    }

    await addItem("utilizadores", {
      nome,
      email,
      telemovel,
      morada,
      senha,
      perfil
    });

    mostrarAlerta(`Utilizador (${perfil}) criado com sucesso!`, "sucesso");
    form.reset();
    renderUtilizadores();
  });

  renderUtilizadores();
});
