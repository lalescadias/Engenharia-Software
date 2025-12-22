document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const senha = document.getElementById("senha").value;

    if (!db) {
      mostrarAlerta("Base de dados ainda a carregar, tente novamente.", "erro");
      return;
    }

    const user = await getByIndex("utilizadores", "email", email);

    

    if (!user || !(await verifyPassword(senha, user))) {
      mostrarAlerta("Credenciais inválidas.", "erro");
      return;
    }
    localStorage.setItem("userSessao", JSON.stringify(user));
    mostrarAlerta(`Bem-vindo(a), ${user.nome}!`, "sucesso");

    setTimeout(() => {
      if (user.perfil === "admin") {
        window.location.href = "admin/painel.html";
      } else if (user.perfil === "monitor") {
        window.location.href = "monitor/painel.html";
      } else {
        window.location.href = "encarregado/painel.html";
      }
    }, 1000);
  });
});
