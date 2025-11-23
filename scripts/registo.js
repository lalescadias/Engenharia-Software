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
      mostrarAlerta("As palavras-passe não coincidem!", "erro);");
      return;
    }

    // Espera o IndexedDB abrir
    if (!db) {
      mostrarAlerta("Base de dados ainda a carregar, tente novamente.", "erro");
      return;
    }

    // Verifica se já existe
    const existente = await getByIndex("utilizadores", "email", email);
    if (existente) {
      mostrarAlerta("Já existe uma conta com este email!", "erro");
      return;
    }

    // Validação do telemóvel (formato internacional)
    const regexTelemovel = /^\+\d{1,3}\d{7,12}$/;


    if (!regexTelemovel.test(telemovel)) {
      mostrarAlerta("Formato inválido. Use o padrão internacional, ex: +351912345678.", "erro");
      return;
    }

    const novo = { nome, email, telemovel, morada, senha, perfil: "encarregado" };

    await addItem("utilizadores", novo);
    mostrarAlerta("Conta criada com sucesso!", "sucesso");
    setTimeout(() => window.location.href = "index.html", 1200);

  });
});
