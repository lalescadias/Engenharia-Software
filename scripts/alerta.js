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


function confirmarAcao(mensagem, tipo = "info") {
  return new Promise((resolve) => {
    // Remove modal anterior se existir
    const existente = document.querySelector(".modal-alerta");
    if (existente) existente.remove();

    // Cria o modal de confirmação
    const modal = document.createElement("div");
    modal.className = `modal-alerta modal-${tipo}`;
    modal.innerHTML = `
      <div class="modal-alerta-conteudo">
        <p>${mensagem}</p>
        <div class="botoes">
          <button id="btnConfirmar" class="btn btn-primaria">Sim</button>
          <button id="btnCancelar" class="btn btn-secundaria">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Fecha o modal com animação 
    const fechar = (resultado) => {
      modal.classList.add("fechar");
      setTimeout(() => {
        modal.remove();
        resolve(resultado);
      }, 250);
    };

    modal.querySelector("#btnConfirmar").addEventListener("click", () => fechar(true));
    modal.querySelector("#btnCancelar").addEventListener("click", () => fechar(false));
  });
}
