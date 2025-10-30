document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  // ---- Guarda de sessão ----
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  if (!userSessao || userSessao.perfil !== "admin") {
    alert("Acesso restrito a administradores!");
    window.location.href = "../index.html";
    return;
  }

  // ---- Referências ----
  const form = document.getElementById("formAtividade");
  const tbody = document.getElementById("listaAtividades");
  const selectSala = document.getElementById("sala");
  const selectMonitor = document.getElementById("monitorResponsavel");
  const btnSubmit = form.querySelector("button[type='submit']");
  let btnCancelar = null;

  // ========= Helpers =========

  // ✅ reset “de verdade” que mantém selects populados e sai do modo edição
  function limparForm({ zerarTudo = true } = {}) {
    form.reset();

    // Zerar manualmente campos que tinham defaults ou podem ter sido autocompletados
    if (zerarTudo) {
      const byId = (id) => document.getElementById(id);
      ["titulo", "descricao", "imagem", "dataInicio", "dataFim"].forEach(id => {
        const el = byId(id);
        if (el) el.value = "";
      });
      const he = byId("horaEntrada"); if (he) he.value = "09:00";
      const hs = byId("horaSaida");   if (hs) hs.value = "17:00";
      const lot = byId("lotacao");    if (lot) lot.value = "20";
    }

    // Mantém selects carregados e volta para “Selecione…”
    if (selectSala && selectSala.options.length) selectSala.selectedIndex = 0;
    if (selectMonitor && selectMonitor.options.length) selectMonitor.selectedIndex = 0;

    delete form.dataset.editando;
    btnSubmit.textContent = "Guardar atividade";

    if (btnCancelar) {
      btnCancelar.remove();
      btnCancelar = null;
    }
  }

  // ✅ carrega salas usando o campo que tens na store: nomeSala
  async function carregarSalas() {
    const salas = await getAll("salas");
    selectSala.innerHTML = `<option value="">Selecione...</option>`;
    salas.forEach(s => {
      const nome = s.nomeSala || s.nome || s.titulo || `Sala ${s.id}`;
      const opt = document.createElement("option");
      opt.value = nome;
      opt.textContent = nome;
      selectSala.appendChild(opt);
    });
  }

  // ✅ carrega apenas perfis "monitor"
  async function carregarMonitores() {
    const utilizadores = await getAll("utilizadores");
    const monitores = utilizadores.filter(u => u.perfil === "monitor");
    selectMonitor.innerHTML = `<option value="">Selecione...</option>`;
    monitores.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.nome;
      selectMonitor.appendChild(opt);
    });
  }

  // ✅ render robusto (sem mexer no card do formulário)
  async function renderLista() {
    const atividades = await getAll("atividades");
    tbody.innerHTML = "";

    if (!atividades.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Nenhuma atividade registada.</td></tr>`;
      return;
    }

    atividades.forEach(a => {
      const inicio = new Date(a.dataInicio).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
      const fim = new Date(a.dataFim).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.titulo}</td>
        <td>${inicio} – ${fim}</td>
        <td>${a.sala || "—"}</td>
        <td>${a.lotacao ?? "—"}</td>
        <td>
          <button class="btn btn-destaque" data-acao="editar" data-id="${a.id}">Editar</button>
          <button class="btn btn-perigo" data-acao="remover" data-id="${a.id}">Remover</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ========= Eventos =========

  // ✅ delegação (editar/remover)
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    const acao = btn.dataset.acao;

    if (acao === "remover") {
      if (!confirm("Deseja remover esta atividade?")) return;
      const tx = db.transaction(["atividades"], "readwrite");
      tx.objectStore("atividades").delete(id);
      tx.oncomplete = () => renderLista();
      tx.onerror = () => alert("Erro ao remover atividade.");
      return;
    }

    if (acao === "editar") {
      const atividades = await getAll("atividades");
      const a = atividades.find(x => x.id === id);
      if (!a) return;

      // ✅ garante que os selects estão populados antes de setar o valor
      await carregarSalas();
      await carregarMonitores();

      // Preenche o formulário
      document.getElementById("titulo").value = a.titulo || "";
      document.getElementById("descricao").value = a.descricao || "";
      document.getElementById("imagem").value = a.imagem || "";
      document.getElementById("dataInicio").value = a.dataInicio || "";
      document.getElementById("dataFim").value = a.dataFim || "";
      document.getElementById("horaEntrada").value = a.horaEntrada || "09:00";
      document.getElementById("horaSaida").value = a.horaSaida || "17:00";
      document.getElementById("lotacao").value = a.lotacao ?? 20;

      // ✅ se a sala/monitor original não existir mais nas opções, cria opção “fantasma” só para exibir
      if (a.sala) {
        if (![...selectSala.options].some(o => o.value === a.sala)) {
          const opt = new Option(a.sala, a.sala);
          selectSala.add(opt);
        }
        selectSala.value = a.sala;
      }
      if (a.idMonitor) {
        if (![...selectMonitor.options].some(o => Number(o.value) === Number(a.idMonitor))) {
          const opt = new Option(a.monitorNome || `Monitor #${a.idMonitor}`, a.idMonitor);
          selectMonitor.add(opt);
        }
        selectMonitor.value = String(a.idMonitor);
      }

      form.dataset.editando = String(a.id);
      btnSubmit.textContent = "Atualizar atividade";

      // botão Cancelar (apenas em modo edição)
      if (!btnCancelar) {
        btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.className = "btn btn-secundaria";
        btnCancelar.style.marginLeft = "10px";
        btnSubmit.after(btnCancelar);
        btnCancelar.onclick = () => limparForm(); // sai do modo edição
      }

      // UX
      document.getElementById("titulo").focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // ✅ criar/atualizar com validações de negócio
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const imagem = document.getElementById("imagem").value.trim();
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;
    const horaEntrada = document.getElementById("horaEntrada").value;
    const horaSaida = document.getElementById("horaSaida").value;
    const lotacao = Number(document.getElementById("lotacao").value);
    const sala = selectSala.value.trim();
    const idMonitor = selectMonitor.value.trim();

    // Regras obrigatórias
    if (!titulo) return alert("Por favor, insira o título da atividade.");
    if (!sala) return alert("Por favor, selecione uma sala.");
    if (!idMonitor) return alert("Por favor, selecione o monitor responsável.");
    if (!dataInicio || !dataFim) return alert("Preencha as datas de início e fim.");
    if (new Date(dataFim) < new Date(dataInicio)) return alert("A data de fim não pode ser anterior à de início.");

    const payload = {
      titulo,
      descricao,
      imagem,
      dataInicio,
      dataFim,
      horaEntrada,
      horaSaida,
      lotacao,
      sala,                          // nome da sala
      idMonitor: Number(idMonitor),  // FK do utilizador monitor
      monitorNome: selectMonitor.selectedOptions[0]?.textContent || ""
    };

    const editId = form.dataset.editando ? Number(form.dataset.editando) : null;

    if (editId) {
      // Atualizar
      const tx = db.transaction(["atividades"], "readwrite");
      tx.objectStore("atividades").put({ ...payload, id: editId });
      tx.oncomplete = async () => {
        alert("Atividade atualizada com sucesso!");
        limparForm();          // sai do modo edição e limpa
        await renderLista();   // atualiza tabela
      };
      tx.onerror = () => alert("Erro ao atualizar a atividade.");
    } else {
      // Criar
      await addItem("atividades", payload);
      alert("Atividade criada com sucesso!");
      limparForm();            // limpa form (mantém selects prontos)
      await renderLista();
    }
  });

  // ✅ botão “Limpar” do formulário
  form.addEventListener("reset", async (e) => {
    e.preventDefault();
    limparForm();              // limpa e mantém selects
    // garante que selects ficam consistentes (opcional)
    await carregarSalas();
    await carregarMonitores();
  });

  // ========= Boot =========
  await carregarSalas();
  await carregarMonitores();
  await renderLista();
});
