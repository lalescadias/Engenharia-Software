document.addEventListener("DOMContentLoaded", async () => {
  await dbReady;

  const params = new URLSearchParams(window.location.search);
  const idCrianca = Number(params.get("id"));

  const criancas = await getAll("criancas");
  const inscricoes = await getAll("inscricoes");
  const atividades = await getAll("atividades");
  const utilizadores = await getAll("utilizadores");

  const crianca = criancas.find(c => c.id === idCrianca);
  const info = document.getElementById("infoCrianca");
  const corpo = document.getElementById("listaInscricoes");

  if (!crianca) {
    info.innerHTML = "<p>❌ Criança não encontrada.</p>";
    return;
  }

  // 🔹 Busca o encarregado pelo id
  const encarregado = utilizadores.find(u => u.id === crianca.idEncarregado);

  // 🔹 Calcular idade
  let idade = "—";
  if (crianca.dataNascimento) {
    const nasc = new Date(crianca.dataNascimento);
    const hoje = new Date();
    idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  }

  //  Montar bloco de informações (corrigido)
  info.innerHTML = `
    <h2>${crianca.nome}</h2>
    <div class="grid grid-2">
      <p><strong>Idade:</strong> ${idade} anos</p>
      <p><strong>Data de nascimento:</strong> ${crianca.dataNascimento || "—"}</p>
      <p><strong>Autorização para fotos:</strong> ${
        crianca.autorizacaoFoto ? "✅ Sim" : "❌ Não"
      }</p>
      <p><strong>Observações:</strong> ${crianca.observacoes || "—"}</p>
      <p><strong>Encarregado:</strong> ${encarregado ? encarregado.nome : "—"}</p>
      <p><strong>Email do encarregado:</strong> ${encarregado ? encarregado.email : "—"}</p>
      <p><strong>Telemóvel:</strong> ${encarregado ? encarregado.telemovel : "—"}</p>
      <p><strong>Morada:</strong> ${encarregado ? encarregado.morada : "—"}</p>
    </div>
  `;

  // Listar atividades associadas
  const minhasInscricoes = inscricoes.filter(i => i.idCrianca === idCrianca);
  corpo.innerHTML = "";

  if (minhasInscricoes.length === 0) {
    corpo.innerHTML = `<tr><td colspan="4" style="text-align:center;">Nenhuma inscrição encontrada.</td></tr>`;
    return;
  }

  minhasInscricoes.forEach(i => {
    const a = atividades.find(a => a.id === i.idAtividade);
    const inicio = new Date(a.dataInicio).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
    });
    const fim = new Date(a.dataFim).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
    });

    const etiqueta =
      i.estado === "Confirmada"
        ? "estado-confirmada"
        : i.estado === "Cancelada"
        ? "estado-cancelada"
        : "estado-pendente";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a?.titulo || "—"}</td>
      <td>${inicio} – ${fim}</td>
      <td><span class="etiqueta ${etiqueta}">${i.estado}</span></td>
      <td>${new Date(i.dataInscricao).toLocaleDateString("pt-PT")}</td>
    `;
    corpo.appendChild(tr);
  });
});
