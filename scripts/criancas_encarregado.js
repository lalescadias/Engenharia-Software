document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao) {
    alert("Sessão expirada!");
    window.location.href = "../index.html";
    return;
  }

  const form = document.getElementById("formCrianca");
  const lista = document.getElementById("listaCriancas");
  const btnSubmit = form.querySelector("button[type='submit']");
  let btnCancelar = null;
  let modoEdicao = null;

  // Adicionar ou atualizar
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const dataNascimento = document.getElementById("dataNascimento").value;
    const sns = document.getElementById("sns").value.trim();
    const observacoes = document.getElementById("observacoes").value.trim();
    const autorizacaoImagem = document.getElementById("autorizacaoImagem").checked;

    if (!nome || !dataNascimento) {
      alert("Preencha o nome e a data de nascimento!");
      return;
    }

    if (modoEdicao) {
      await atualizarCrianca(modoEdicao, { nome, dataNascimento, sns, observacoes, autorizacaoImagem });
      alert("Criança atualizada!");
      cancelarEdicao();
    } else {
      await addItem("criancas", {
        idEncarregado: userSessao.id,
        nome,
        dataNascimento,
        sns,
        observacoes,
        autorizacaoImagem,
        criadoEm: new Date().toISOString()
      });
      alert("Criança adicionada!");
    }

    form.reset();
    renderLista();
  });

  async function atualizarCrianca(id, novosDados) {
    const todas = await getAll("criancas");
    const c = todas.find(x => x.id === id);
    if (!c) return;
    Object.assign(c, novosDados);
    const dbx = await dbReady;
    const tx = dbx.transaction("criancas", "readwrite");
    tx.objectStore("criancas").put(c);
  }

  function cancelarEdicao() {
    modoEdicao = null;
    form.reset();
    btnSubmit.textContent = "Adicionar";
    if (btnCancelar) {
      btnCancelar.remove();
      btnCancelar = null;
    }
  }

  async function removerCrianca(id) {
    if (!confirm("Tem certeza que deseja remover esta criança?")) return;
    const dbx = await dbReady;
    const tx = dbx.transaction("criancas", "readwrite");
    tx.objectStore("criancas").delete(id);
    renderLista();
  }

  async function renderLista() {
    const todas = await getAll("criancas");
    const minhas = todas.filter(c => c.idEncarregado === userSessao.id);

    lista.innerHTML = "";
    if (minhas.length === 0) {
      lista.innerHTML = `<tr><td colspan="2" style="text-align:center;">Nenhuma criança registada.</td></tr>`;
      return;
    }

    minhas.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>
          <div class="acoes-crianca">
            <button class="btn btn-destaque editar">Editar</button>
            <button class="btn btn-perigo remover">Remover</button>
          </div>
        </td>
      `;

      tr.querySelector(".editar").onclick = () => {
        modoEdicao = c.id;
        document.getElementById("nome").value = c.nome;
        document.getElementById("dataNascimento").value = c.dataNascimento;
        document.getElementById("sns").value = c.sns || "";
        document.getElementById("observacoes").value = c.observacoes || "";
        document.getElementById("autorizacaoImagem").checked = c.autorizacaoImagem;

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

      tr.querySelector(".remover").onclick = () => removerCrianca(c.id);
      lista.appendChild(tr);
    });
  }

  renderLista();
});
