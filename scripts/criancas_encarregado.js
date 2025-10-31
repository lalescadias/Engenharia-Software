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

  // ====== SUBMIT (Adicionar / Atualizar) ======
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

    // 🔹 Validação: impedir datas futuras e menores de 3 anos
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    if (nascimento > hoje) {
      alert("A data de nascimento não pode ser no futuro!");
      return;
    }

    const idade =
      hoje.getFullYear() - nascimento.getFullYear() -
      (hoje.getMonth() < nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
        ? 1
        : 0);

    if (idade < 3) {
      alert("A criança deve ter pelo menos 3 anos de idade para ser registada!");
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
        ativa: true, // ✅ nova propriedade
        criadoEm: new Date().toISOString()
      });
      alert("Criança adicionada!");
    }

    form.reset();
    renderLista();
  });

  // ====== ATUALIZAR CRIANÇA ======
  async function atualizarCrianca(id, novosDados) {
    const todas = await getAll("criancas");
    const c = todas.find(x => x.id === id);
    if (!c) return;
    Object.assign(c, novosDados);
    const dbx = await dbReady;
    const tx = dbx.transaction("criancas", "readwrite");
    tx.objectStore("criancas").put(c);
  }

  // ====== CANCELAR EDIÇÃO ======
  function cancelarEdicao() {
    modoEdicao = null;
    form.reset();
    btnSubmit.textContent = "Adicionar";
    if (btnCancelar) {
      btnCancelar.remove();
      btnCancelar = null;
    }
  }

  // ====== REMOVER / DESATIVAR CRIANÇA ======
  async function removerCrianca(id) {
    if (!confirm("Tem certeza que deseja remover esta criança?")) return;
    const dbx = await dbReady;

    // Verifica dependências antes de apagar
    const inscricoes = await getAll("inscricoes");
    const presencas = await getAll("presencas");

    const temLigacoes =
      inscricoes.some(i => i.idCrianca === id) ||
      presencas.some(p => p.idCrianca === id);

    if (temLigacoes) {
      // ⚠️ Em vez de apagar, marca como inativa e cancela inscrições
      const todas = await getAll("criancas");
      const crianca = todas.find(c => c.id === id);
      if (!crianca) return;

      crianca.ativa = false; // 🚫 desativa
      const txCriancas = dbx.transaction("criancas", "readwrite");
      txCriancas.objectStore("criancas").put(crianca);

      // 🟡 Atualiza inscrições da criança
      const inscricoesAtualizadas = inscricoes.map(i => {
        if (i.idCrianca === id && i.estado !== "Cancelada") {
          i.estado = "Cancelada";
          i.dataCancelamento = new Date().toISOString();
        }
        return i;
      });

      const txInscricoes = dbx.transaction("inscricoes", "readwrite");
      const store = txInscricoes.objectStore("inscricoes");
      inscricoesAtualizadas.forEach(i => store.put(i));

      txInscricoes.oncomplete = () => {
        alert("Esta criança participou de atividades; foi desativada e suas inscrições foram canceladas.");
        renderLista();
      };
      return;
    }

    // ✅ Caso não tenha participações, pode remover normalmente
    const tx = dbx.transaction("criancas", "readwrite");
    tx.objectStore("criancas").delete(id);
    tx.oncomplete = () => {
      alert("Criança removida com sucesso!");
      renderLista();
    };
  }

  // ====== RENDERIZAR LISTA ======
  async function renderLista() {
    const todas = await getAll("criancas");
    const minhas = todas
      .filter(c => c.idEncarregado === userSessao.id)
      .filter(c => c.ativa !== false); // 👈 apenas ativas

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

      // 🟡 Edição
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

      // 🔴 Remover / Desativar
      tr.querySelector(".remover").onclick = () => removerCrianca(c.id);
      lista.appendChild(tr);
    });
  }

  await renderLista();
});
