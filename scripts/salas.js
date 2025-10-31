document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;
  // Segurança de sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    alert("Acesso restrito a administradores!");
    window.location.href = "../index.html";
    return;
  }

  const form = document.getElementById("formSala");
  const lista = document.getElementById("listaSalas");
  const btnSubmit = form.querySelector("button[type='submit']");
  let modoEdicao = null;
  let btnCancelar = null;

  //  Adicionar / Atualizar sala
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nomeSala = document.getElementById("nomeSala").value.trim();
    const capacidade = Number(document.getElementById("capacidade").value);
    const descricaoSala = document.getElementById("descricaoSala").value.trim();

    if (!nomeSala || capacidade < 1) {
      alert("Preencha o nome e a capacidade!");
      return;
    }

    if (modoEdicao) {
      await atualizarSala(modoEdicao, { nomeSala, capacidade, descricaoSala });
      alert("Sala atualizada!");
      cancelarEdicao();
    } else {
      await addItem("salas", { nomeSala, capacidade, descricaoSala });
      alert("Sala criada com sucesso!");
    }

    form.reset();
    renderLista();
  });

  async function atualizarSala(id, novosDados) {
    const todas = await getAll("salas");
    const s = todas.find(x => x.id === id);
    if (!s) return;
    Object.assign(s, novosDados);
    const dbx = await dbReady;
    const tx = dbx.transaction("salas", "readwrite");
    tx.objectStore("salas").put(s);
  }

  function cancelarEdicao() {
    modoEdicao = null;
    form.reset();
    btnSubmit.textContent = "Guardar sala";
    if (btnCancelar) {
      btnCancelar.remove();
      btnCancelar = null;
    }
  }

  async function removerSala(id) {
    if (!confirm("Tem certeza que deseja remover esta sala?")) return;
    const dbx = await dbReady;
    const tx = dbx.transaction("salas", "readwrite");
    tx.objectStore("salas").delete(id);
    renderLista();
  }

  async function renderLista() {
    const salas = await getAll("salas");
    lista.innerHTML = "";

    if (salas.length === 0) {
      lista.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhuma sala registada.</td></tr>`;
      return;
    }

    salas.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.nomeSala}</td>
        <td>${s.capacidade}</td>
        <td>${s.descricaoSala || "—"}</td>
        <td>
          <button class="btn btn-destaque editar">Editar</button>
          <button class="btn btn-perigo remover">Remover</button>
        </td>
      `;

      tr.querySelector(".editar").onclick = () => {
        modoEdicao = s.id;
        document.getElementById("nomeSala").value = s.nomeSala;
        document.getElementById("capacidade").value = s.capacidade;
        document.getElementById("descricaoSala").value = s.descricaoSala || "";

        btnSubmit.textContent = "Atualizar";
        if (!btnCancelar) {
          btnCancelar = document.createElement("button");
          btnCancelar.type = "button";
          btnCancelar.textContent = "Cancelar";
          btnCancelar.className = "btn btn-secundaria";
          btnCancelar.style.marginLeft = "10px";
          btnSubmit.after(btnCancelar);
          btnCancelar.onclick = cancelarEdicao;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      tr.querySelector(".remover").onclick = () => removerSala(s.id);
      lista.appendChild(tr);
    });
  }

  renderLista();
});
