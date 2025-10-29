// scripts/sessao.js
document.addEventListener("DOMContentLoaded", () => {
  const userSessao = JSON.parse(localStorage.getItem("userSessao"));
  const path = window.location.pathname.toLowerCase();

  //  Caso não esteja logado e tente abrir página privada
  const paginaPublica = path.endsWith("index.html") || path.endsWith("registo.html");
  if (!userSessao && !paginaPublica) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "../index.html";
    return;
  }
  // Redirecionamento automático por perfil
  if (userSessao) {
    const perfil = userSessao.perfil;

    // Se o perfil tentar abrir página de outro tipo → redireciona corretamente
    if (perfil === "admin" && !path.includes("/admin/")) {
      window.location.href = "../admin/painel.html";
      return;
    }

    if (perfil === "monitor" && !path.includes("/monitor/")) {
      window.location.href = "../monitor/painel.html";
      return;
    }

    if (perfil === "encarregado" && !path.includes("/encarregado/")) {
      window.location.href = "../encarregado/painel.html";
      return;
    }
  }

  // Função de logout universal
  const btnSair = document.getElementById("btnSair");
  if (btnSair) {
    btnSair.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("userSessao");
      alert("Sessão terminada!");
      window.location.href = "../index.html";
    });
  }
});
