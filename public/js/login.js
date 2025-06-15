// js/login.js

// Objeto para o banco de dados de usuários (em memória, atualizado do JSON Server)
var db_usuarios = [];
// Objeto para o usuário corrente (reflete o que está no sessionStorage)
var usuarioCorrente = {};

// Função para gerar códigos randômicos (UUID)
function generateUUID() {
    var d = new Date().getTime();
    var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;
        if (d > 0) {
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// Inicializa a lista de usuários do JSON Server
async function initAuthApp() {
    console.log("DEBUG: initAuthApp() chamado. Tentando carregar usuários do JSON Server...");
    try {
        // Usa a constante GLOBAL API_USUARIOS_URL
        const response = await fetch(API_USUARIOS_URL);
        if (!response.ok) {
            console.error(`DEBUG: Erro ao carregar usuários na inicialização: HTTP ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        db_usuarios = data;
        console.log("DEBUG: Usuários carregados:", db_usuarios);
    } catch (error) {
        console.error('DEBUG: Erro na requisição de initAuthApp:', error);
    }
}

// Verifica se o login do usuário está ok e, se positivo, salva no sessionStorage
async function loginUser(username, password) {
    console.log(`DEBUG: Tentando logar com Usuário: '${username}', Senha: '${password}'`);
    try {
        // Usa a constante GLOBAL API_USUARIOS_URL
        const response = await fetch(`${API_USUARIOS_URL}?login=${encodeURIComponent(username)}`);
        console.log("DEBUG: Resposta inicial da API para busca de usuário:", response);

        if (!response.ok) {
            console.error(`DEBUG: Erro HTTP ao buscar usuário: ${response.status} - ${response.statusText}`);
            alert('Erro na comunicação com o servidor ao tentar buscar usuário. Tente novamente mais tarde.');
            return false;
        }

        const usuariosEncontrados = await response.json();
        console.log("DEBUG: Usuários encontrados pela API (json):", usuariosEncontrados);

        if (usuariosEncontrados.length > 0) {
            const usuario = usuariosEncontrados[0];
            console.log("DEBUG: Usuário encontrado no DB:", usuario);

            if (password === usuario.senha) {
                // Login bem-sucedido
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));
                console.log("DEBUG: Login BEM-SUCEDIDO! Usuário salvo no sessionStorage:", usuario);
                alert('Login realizado com sucesso!');
                window.location.href = 'index.html'; // Redireciona para a página inicial
                return true;
            } else {
                console.log("DEBUG: Senha incorreta.");
            }
        } else {
            console.log("DEBUG: Usuário não encontrado no DB.");
        }
        alert('Usuário ou senha incorretos.');
        return false;

    } catch (error) {
        console.error('DEBUG: Erro geral na função loginUser (fetch ou parse):', error);
        alert('Erro inesperado ao tentar fazer login. Verifique sua conexão ou console.');
        return false;
    }
}

// Apaga os dados do usuário corrente no sessionStorage
function logoutUser() {
    sessionStorage.removeItem('usuarioLogado'); // Remove o usuário da sessão
    alert('Você foi desconectado.');
    window.location.href = 'login.html'; // Redireciona para a página de login
}

// Adiciona um novo usuário no JSON Server
async function addUser(nome, login, senha, email) {
    // Verifica se o login já existe localmente (pré-verificação)
    const loginExistente = db_usuarios.some(user => user.login === login);
    if (loginExistente) {
        alert('Este login de usuário já existe. Por favor, escolha outro.');
        return false;
    }

    // Cria um objeto de usuario para o novo usuario
    const newId = generateUUID();
    const usuario = { "id": newId, "login": login, "senha": senha, "nome": nome, "email": email, "admin": false }; // Novo usuário NÃO é admin por padrão

    try {
        // Usa a constante GLOBAL API_USUARIOS_URL
        const response = await fetch(API_USUARIOS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(usuario),
        });
        const data = await response.json();
        db_usuarios.push(data); // Adiciona o novo usuário na variável db_usuarios em memória
        alert('Usuário cadastrado com sucesso! Agora você pode fazer login.');
        return true;
    } catch (error) {
        console.error('Erro ao inserir usuário via API JSONServer:', error);
        alert('Erro ao cadastrar usuário. Tente novamente mais tarde.');
        return false;
    }
}

// --- Funções de Eventos de Formulário (Login e Cadastro) ---

// Processa o formulário de login (chamada do login.html)
// Esta função é chamada pelo onsubmit do formulário em login.html
async function processaFormLogin(form) {
    console.log("DEBUG: processaFormLogin (Formulário submetido) chamado.");
    const username = form.username.value;
    const password = form.password.value;
    await loginUser(username, password);
}

// Salva um novo usuário (chamada do cadastro-usuario.html)
// Esta função é chamada pelo onsubmit do formulário em cadastro-usuario.html
async function salvaNovoUsuario(form) {
    const login = form.txt_login.value;
    const nome = form.txt_nome.value;
    const email = form.txt_email.value;
    const senha = form.txt_senha.value;
    const senha2 = form.txt_senha2.value;

    if (senha !== senha2) {
        alert('As senhas informadas não conferem.');
        return;
    }

    const sucesso = await addUser(nome, login, senha, email);
    if (sucesso) {
        window.location.href = 'login.html'; // Redireciona para a página de login após o cadastro
    }
}

// Inicializa a lógica de autenticação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    initAuthApp(); // Carrega a lista de usuários ao iniciar
});