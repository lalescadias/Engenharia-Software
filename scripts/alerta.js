function mostrarAlerta(mensagem, tipo = "info") {
  const existente = document.querySelector(".modal-alerta");
  if (existente) existente.remove();

  const modal = document.createElement("div");
  modal.className = `modal-alerta modal-${tipo}`;
  modal.innerHTML = `
    <div class="modal-alerta-conteudo">
      <p>${mensagem}</p>
      <button id="btnFecharModal" class="btn btn-primaria">OK</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#btnFecharModal").addEventListener("click", () => {
    modal.classList.add("fechar");
    setTimeout(() => modal.remove(), 250);
  });
}
