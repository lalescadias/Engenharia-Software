document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // Segurança de sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "encarregado") {
    mostrarAlerta("Acesso restrito a encarregados!", "erro");
    window.location.href = "../index.html";
    return;
  }

  const form = document.getElementById("formCrianca");
  const lista = document.getElementById("listaCriancas");
  const btnSubmit = form.querySelector("button[type='submit']");
  let btnCancelar = null;
  let modoEdicao = null;

  // SUBMIT (Adicionar / Atualizar)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const dataNascimento = document.getElementById("dataNascimento").value;
    const sns = document.getElementById("sns").value.trim();
    const observacoes = document.getElementById("observacoes").value.trim();
    const autorizacaoImagem = document.getElementById("autorizacaoImagem").checked;

    if (!nome || !dataNascimento) {
      mostrarAlerta("Preencha o nome e a data de nascimento!", "erro");
      return;
    }

    // Validação de idade e data
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    if (nascimento > hoje) {
      mostrarAlerta("A data de nascimento não pode ser no futuro!", "erro");
      return;
    }

    const idade =
      hoje.getFullYear() - nascimento.getFullYear() -
      (hoje.getMonth() < nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
        ? 1 : 0);

    if (idade < 3) {
      mostrarAlerta("A criança deve ter pelo menos 3 anos!", "erro");
      return;
    }

    if (modoEdicao) {
      await atualizarCrianca(modoEdicao, { nome, dataNascimento, sns, observacoes, autorizacaoImagem });
      mostrarAlerta("Criança atualizada!", "sucesso");
      cancelarEdicao();
    } else {
      await addItem("criancas", {
        idEncarregado: userSessao.id,
        nome,
        dataNascimento,
        sns,
        observacoes,
        autorizacaoImagem,
        ativa: true,
        criadoEm: new Date().toISOString()
      });
      mostrarAlerta("Criança adicionada!", "sucesso");
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

  // Remover / Desativar / Reativar
  async function alternarEstadoCrianca(id, ativar = false) {
  const dbx = await dbReady;
  const todas = await getAll("criancas");
  const crianca = todas.find(c => c.id === id);
  if (!crianca) return;

  // Reativar
  if (ativar) {
    crianca.ativa = true;
    const tx = dbx.transaction("criancas", "readwrite");
    tx.objectStore("criancas").put(crianca);
    tx.oncomplete = () => {
      mostrarAlerta("Criança reativada com sucesso!", "sucesso");
      renderLista();
    };
    return;
  }

  // Verifica se há vínculos
  const inscricoes = await getAll("inscricoes");
  const presencas = await getAll("presencas");
  const temLigacoes =
    inscricoes.some(i => i.idCrianca === id) ||
    presencas.some(p => p.idCrianca === id);

  // Mensagem dinâmica conforme o caso
  const mensagem = temLigacoes
    ? "Esta criança já participou de atividades. Deseja desativá-la e cancelar suas inscrições?"
    : "Tem certeza que deseja remover esta criança definitivamente?";

  const confirmar = await confirmarAcao(mensagem, "erro");
  if (!confirmar) return;

  if (temLigacoes) {
    // Apenas desativa e cancela inscrições
    crianca.ativa = false;
    const tx = dbx.transaction("criancas", "readwrite");
    tx.objectStore("criancas").put(crianca);

    const txInscricoes = dbx.transaction("inscricoes", "readwrite");
    const store = txInscricoes.objectStore("inscricoes");
    inscricoes.forEach(i => {
      if (i.idCrianca === id && i.estado !== "Cancelada") {
        i.estado = "Cancelada";
        i.dataCancelamento = new Date().toISOString();
        store.put(i);
      }
    });

    txInscricoes.oncomplete = () => {
      mostrarAlerta("Criança desativada e inscrições canceladas.", "info");
      renderLista();
    };
  } else {
    // Remove totalmente
    const tx = dbx.transaction("criancas", "readwrite");
    tx.objectStore("criancas").delete(id);
    tx.oncomplete = () => {
      mostrarAlerta("Criança removida com sucesso!", "sucesso");
      renderLista();
    };
  }
}


  // Render lista
  async function renderLista() {
    const todas = await getAll("criancas");
    const minhas = todas.filter(c => c.idEncarregado === userSessao.id);
    const inscricoes = await getAll("inscricoes");
    const presencas = await getAll("presencas");

    lista.innerHTML = "";

    if (minhas.length === 0) {
      lista.innerHTML = `<tr><td colspan="3" style="text-align:center;">Nenhuma criança registada.</td></tr>`;
      return;
    }

    minhas.forEach(c => {
      const tr = document.createElement("tr");

      const temLigacoes =
        inscricoes.some(i => i.idCrianca === c.id) ||
        presencas.some(p => p.idCrianca === c.id);

      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${c.ativa ? "Ativa" : "<span style='color:red;'>Inativa</span>"}</td>
        <td>
          <div class="acoes-crianca">
            ${
              c.ativa
                ? `
                    <button class="btn btn-destaque editar">Editar</button>
                    ${
                      temLigacoes
                        ? `<button class="btn btn-perigo remover">Desativar</button>`
                        : `<button class="btn btn-perigo remover">Remover</button>`
                    }
                  `
                : `<button class="btn btn-primaria ativar">Ativar</button>`
            }
          </div>
        </td>
      `;

      if (c.ativa) {
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

        tr.querySelector(".remover").onclick = () => alternarEstadoCrianca(c.id, false);
      } else {
        tr.querySelector(".ativar").onclick = () => alternarEstadoCrianca(c.id, true);
      }

      lista.appendChild(tr);
    });
  }

  await renderLista();
});
