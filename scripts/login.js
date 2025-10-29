document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const senha = document.getElementById("senha").value;

    if (!db) {
      alert("Base de dados ainda a carregar, tente novamente.");
      return;
    }

    const user = await getByIndex("utilizadores", "email", email);

    if (!user || user.senha !== senha) {
      alert("Credenciais inválidas.");
      return;
    }

    localStorage.setItem("userSessao", JSON.stringify(user));
    alert(`Bem-vindo(a), ${user.nome}!`);

    // Redireciona conforme o perfil
    if (user.perfil === "admin") {
      window.location.href = "admin/painel.html";
    } else if (user.perfil === "monitor") {
      window.location.href = "monitor/painel.html";
    } else {
      window.location.href = "encarregado/painel.html";
    }
  });
});
