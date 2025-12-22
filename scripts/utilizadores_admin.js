// scripts/utilizadores_admin.js
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

  // contar admins existentes
  async function contarAdmins() {
    const todos = await getAll("utilizadores");
    return todos.filter(u => u.perfil === "admin").length;
  }

  // Renderizar lista de utilizadores
  async function renderUtilizadores() {
    const utilizadores = await getAll("utilizadores");
    lista.innerHTML = "";

    // apenas admin e monitores
    const visiveis = utilizadores.filter(u =>
      u.perfil === "admin" || u.perfil === "monitor"
    );

    if (visiveis.length === 0) {
      lista.innerHTML =
        `<tr><td colspan="4" style="text-align:center;">Nenhum utilizador registado.</td></tr>`;
      return;
    }

    visiveis.forEach(u => {
      const tr = document.createElement("tr");

      const estado =
        u.ativo === false ? "<span style='color:red;'>Inativo</span>" : "Ativo";

      tr.innerHTML = `
        <td>${u.nome}</td>
        <td style="text-transform:capitalize;">${u.perfil}</td>
        <td>${estado}</td>
        <td>
          ${u.ativo === false
          ? `<button class="btn btn-primaria ativar" data-id="${u.id}">Ativar</button>`
          : `<button class="btn btn-perigo btn-remover" data-id="${u.id}" data-perfil="${u.perfil}">Remover</button>`
        }
        </td>
      `;

      lista.appendChild(tr);
    });

    // BOTÃO: REMOVER OU DESATIVAR
    lista.querySelectorAll(".btn-remover").forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const perfil = btn.dataset.perfil;

        const totalAdmins = await contarAdmins();

        // impedir remover a si próprio
        if (userSessao.id === id) {
          mostrarAlerta("Não pode remover o seu próprio utilizador!", "erro");
          return;
        }

        // impedir remover último admin
        if (perfil === "admin" && totalAdmins <= 1) {
          mostrarAlerta("Não é possível remover o último administrador!", "erro");
          return;
        }

        const atividades = await getAll("atividades");
        const presencas = await getAll("presencas");

        const temAtividades = atividades.some(a => a.idMonitor === id);
        const temPresencas = presencas.some(p => p.idMonitor === id);

        // regra 1: monitor com atividades → bloqueado
        if (temAtividades) {
          mostrarAlerta(
            "Este monitor está associado a atividades. Altere primeiro o monitor nessas atividades.",
            "erro"
          );
          return;
        }

        // regra 2: monitor só com presenças → DESATIVAR
        if (temPresencas) {
          const confirmar = await confirmarAcao(
            "Este monitor tem presenças registadas. Pretende desativá-lo?",
            "info"
          );
          if (!confirmar) return;

          const todos = await getAll("utilizadores");
          const u = todos.find(x => x.id === id);
          u.ativo = false;

          const tx = db.transaction("utilizadores", "readwrite");
          tx.objectStore("utilizadores").put(u);
          await new Promise(r => tx.oncomplete = r);

          mostrarAlerta("Monitor desativado com sucesso.", "sucesso");
          renderUtilizadores();
          return;
        }

        // regra 3: sem atividades e sem presenças → remover
        const confirmar = await confirmarAcao(
          "Tem a certeza que deseja remover este utilizador?",
          "erro"
        );
        if (!confirmar) return;

        const tx = db.transaction("utilizadores", "readwrite");
        tx.objectStore("utilizadores").delete(id);
        await new Promise(r => tx.oncomplete = r);

        mostrarAlerta("Utilizador removido com sucesso!", "sucesso");
        renderUtilizadores();
      };
    });

    // BOTÃO: ATIVAR MONITOR
    lista.querySelectorAll(".ativar").forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);

        const todos = await getAll("utilizadores");
        const u = todos.find(x => x.id === id);

        u.ativo = true;

        const tx = db.transaction("utilizadores", "readwrite");
        tx.objectStore("utilizadores").put(u);
        await new Promise(r => tx.oncomplete = r);

        mostrarAlerta("Utilizador reativado com sucesso!", "sucesso");
        renderUtilizadores();
      };
    });
  }

  // SUBMIT — criação de novo utilizador
  form.addEventListener("submit", async e => {
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

    const cred = await hashPassword(senha);

    await addItem("utilizadores", {
      nome,
      email,
      telemovel,
      morada,
      perfil,
      ativo: true,
      ...cred // passwordHash, passwordSalt, iterations
    });

    mostrarAlerta(`Utilizador (${perfil}) criado com sucesso!`, "sucesso");

    form.reset();
    renderUtilizadores();
  });

  renderUtilizadores();
});
