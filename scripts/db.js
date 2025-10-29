// scripts/db.js
// Criação da base de dados Algazarra com IndexedDB

const DB_NAME = "AlgazarraDB";
const DB_VERSION = 1;
let db;
let dbReady; // ✅ adicionamos a Promise global

// Cria e abre a base
dbReady = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    console.log("A criar/atualizar base de dados...");

    // --- Tabela de Utilizadores ---
    if (!db.objectStoreNames.contains("utilizadores")) {
      const store = db.createObjectStore("utilizadores", { keyPath: "id", autoIncrement: true });
      store.createIndex("email", "email", { unique: true });
    }

    // --- Tabela de Crianças ---
    if (!db.objectStoreNames.contains("criancas")) {
      const store = db.createObjectStore("criancas", { keyPath: "id", autoIncrement: true });
      store.createIndex("idEncarregado", "idEncarregado");
    }

    if (!db.objectStoreNames.contains("atividades")) {
      const store = db.createObjectStore("atividades", { keyPath: "id", autoIncrement: true });
      store.createIndex("idMonitor", "idMonitor");
    }
    // --- Outras tabelas ---
    const outras = ["inscricoes", "presencas", "salas"];
    outras.forEach(nome => {
      if (!db.objectStoreNames.contains(nome)) {
        db.createObjectStore(nome, { keyPath: "id", autoIncrement: true });
      }
    });
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("IndexedDB pronto:", db.name);
    resolve(db); // ✅ agora dbReady sabe quando terminou
  };

  request.onerror = (event) => {
    console.error("Erro ao abrir IndexedDB:", event.target.error);
    reject(event.target.error);
  };
});

// -------- Funções genéricas para usar nas páginas --------

// Adicionar dado
async function addItem(storeName, data) {
  const database = await dbReady;
  return new Promise((resolve, reject) => {
    const tx = database.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.add(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Procurar item por índice
async function getByIndex(storeName, indexName, value) {
  const database = await dbReady;
  return new Promise((resolve, reject) => {
    const tx = database.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.get(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Listar todos
async function getAll(storeName) {
  const database = await dbReady;
  return new Promise((resolve, reject) => {
    const tx = database.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

///////////// e para criar admin 
// 🔹 Criar admin padrão se ainda não existir
dbReady.then(async () => {
  const utilizadores = await getAll("utilizadores");
  const existeAdmin = utilizadores.some(u => u.perfil === "admin");

  if (!existeAdmin) {
    const admin = {
      nome: "Administrador",
      email: "admin@algazarra.pt",
      telemovel: "999999999",
      morada: "Sede Algazarra",
      senha: "admin123",
      perfil: "admin"
    };
    await addItem("utilizadores", admin);
    console.log("✅ Admin criado: admin@algazarra.pt / admin123");
  }
});

