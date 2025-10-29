document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formRegisto");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const telemovel = document.getElementById("telemovel").value.trim();
    const morada = document.getElementById("morada").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmar = document.getElementById("confirmarSenha").value;

    if (senha !== confirmar) {
      alert("As palavras-passe não coincidem!");
      return;
    }

    // Espera o IndexedDB abrir
    if (!db) {
      alert("Base de dados ainda a carregar, tente novamente.");
      return;
    }

    // Verifica se já existe
    const existente = await getByIndex("utilizadores", "email", email);
    if (existente) {
      alert("Já existe uma conta com este email!");
      return;
    }

    const novo = { nome, email, telemovel, morada, senha, perfil: "encarregado" };

    await addItem("utilizadores", novo);
    alert("Conta criada com sucesso!");
    window.location.href = "index.html";
  });
});
