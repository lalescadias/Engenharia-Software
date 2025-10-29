document.addEventListener("DOMContentLoaded", async () => {
  // Aguarda o carregamento do IndexedDB
  await dbReady;

  // 🔒 Verifica sessão
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    alert("Acesso restrito a administradores!");
    window.location.href = "../index.html";
    return;
  }

  // Referências dos elementos
  const form = document.getElementById("formAtividade");
  const lista = document.querySelector(".tabela tbody");
  const selectSala = document.getElementById("sala");
  const selectMonitor = document.getElementById("monitorResponsavel");

  // 🔹 Função para carregar as salas
  async function carregarSalas() {
    try {
      const salas = await getAll("salas");
      selectSala.innerHTML = "";

      if (!salas || salas.length === 0) {
        selectSala.innerHTML = `<option value="">Nenhuma sala disponível</option>`;
        return;
      }

      salas.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.nome;
        opt.textContent = s.nome;
        selectSala.appendChild(opt);
      });
    } catch (err) {
      console.error("Erro ao carregar salas:", err);
      selectSala.innerHTML = `<option value="">Erro ao carregar</option>`;
    }
  }

  // 🔹 Função para carregar os monitores
  async function carregarMonitores() {
    const utilizadores = await getAll("utilizadores");
    const monitores = utilizadores.filter((u) => u.perfil === "monitor");

    selectMonitor.innerHTML = `<option value="">Selecione...</option>`;
    monitores.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.nome;
      selectMonitor.appendChild(opt);
    });
  }

  // 🔹 Renderizar tabela de atividades
  async function renderLista() {
    const atividades = await getAll("atividades");
    const utilizadores = await getAll("utilizadores");

    lista.innerHTML = "";

    if (atividades.length === 0) {
      lista.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhuma atividade registada.</td></tr>`;
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
      const monitor = utilizadores.find((u) => u.id === a.idMonitor);
      const nomeMonitor = monitor ? monitor.nome : "—";

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${a.titulo}</td>
        <td>${inicio} – ${fim}</td>
        <td>${a.sala || "—"}</td>
        <td>${nomeMonitor}</td>
        <td>
          <button class="btn btn-destaque btn-editar" data-id="${a.id}">Editar</button>
          <button class="btn btn-perigo btn-remover" data-id="${a.id}">Remover</button>
        </td>
      `;
      lista.appendChild(linha);
    });

    // Remover
    document.querySelectorAll(".btn-remover").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = Number(e.target.dataset.id);
        if (confirm("Deseja remover esta atividade?")) {
          const tx = db.transaction(["atividades"], "readwrite");
          tx.objectStore("atividades").delete(id);
          tx.oncomplete = renderLista;
        }
      });
    });

    // Editar
    document.querySelectorAll(".btn-editar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = Number(e.target.dataset.id);
        const atividade = (await getAll("atividades")).find((a) => a.id === id);
        if (!atividade) return;

        // Preenche o formulário
        form.titulo.value = atividade.titulo;
        form.descricao.value = atividade.descricao;
        form.imagem.value = atividade.imagem;
        form.dataInicio.value = atividade.dataInicio;
        form.dataFim.value = atividade.dataFim;
        form.horaEntrada.value = atividade.horaEntrada;
        form.horaSaida.value = atividade.horaSaida;
        form.lotacao.value = atividade.lotacao;
        selectSala.value = atividade.sala;
        selectMonitor.value = atividade.idMonitor || "";

        form.dataset.editando = id;
        form.querySelector("button[type='submit']").textContent = "Atualizar";
      });
    });
  }

  // 🔹 Submeter formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nova = {
      titulo: form.titulo.value.trim(),
      descricao: form.descricao.value.trim(),
      imagem: form.imagem.value.trim(),
      dataInicio: form.dataInicio.value,
      dataFim: form.dataFim.value,
      horaEntrada: form.horaEntrada.value,
      horaSaida: form.horaSaida.value,
      lotacao: parseInt(form.lotacao.value),
      sala: selectSala.value,
      idMonitor: parseInt(selectMonitor.value) || null,
    };

    if (!nova.sala) {
      alert("Selecione uma sala antes de guardar!");
      return;
    }

    if (form.dataset.editando) {
      const id = Number(form.dataset.editando);
      const tx = db.transaction(["atividades"], "readwrite");
      const store = tx.objectStore("atividades");
      store.put({ ...nova, id });
      tx.oncomplete = () => {
        alert("Atividade atualizada com sucesso!");
        form.reset();
        delete form.dataset.editando;
        form.querySelector("button[type='submit']").textContent =
          "Guardar atividade";
        renderLista();
      };
    } else {
      await addItem("atividades", nova);
      alert("Atividade criada com sucesso!");
      form.reset();
      renderLista();
    }
  });

  // ✅ Espera o DB e carrega tudo
  await carregarSalas();
  await carregarMonitores();
  await renderLista();
});
