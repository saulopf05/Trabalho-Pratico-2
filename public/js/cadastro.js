// js/cadastro.js

// Elementos da página
const adminContent = document.getElementById('admin-content');
const acessoNegado = document.getElementById('acesso-negado');
const filmeForm = document.getElementById('filme-form');
const filmeIdInput = document.getElementById('filme-id');
const tituloInput = document.getElementById('titulo');
const descricaoInput = document.getElementById('descricao');
const imagemInput = document.getElementById('imagem');
const anoInput = document.getElementById('ano');
const generoInput = document.getElementById('genero');
const notaInput = document.getElementById('nota');
const destaqueCheckbox = document.getElementById('destaque');
const filmesTbody = document.getElementById('filmes-tbody');
const formTitle = document.getElementById('form-title');
const btnSalvarFilme = document.getElementById('btn-salvar-filme');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

let editId = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarPermissaoAdmin();

    if (filmeForm) {
        filmeForm.addEventListener('submit', handleFormSubmit);
    }
    if (btnCancelarEdicao) {
        btnCancelarEdicao.addEventListener('click', limparFormulario);
    }
});

// ... (Resto do seu código js/cadastro.js permanece EXATAMENTE como te enviei antes) ...
// (Começando por verificarPermissaoAdmin, carregarFilmes, etc.)

// --- Funções de Controle de Acesso e Exibição ---

function verificarPermissaoAdmin() {
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));

    if (usuarioLogado && usuarioLogado.admin) {
        // Se o usuário é administrador, mostra o conteúdo de administração
        adminContent.style.display = 'block';
        acessoNegado.style.display = 'none';
        carregarFilmes(); // Carrega os filmes na tabela apenas se for admin
    } else {
        // Se não for administrador, esconde o conteúdo e mostra mensagem de acesso negado
        adminContent.style.display = 'none';
        acessoNegado.style.display = 'block';
        // Opcional: Redirecionar para a página inicial ou de login
        // alert('Você não tem permissão de administrador para acessar esta página.');
        // window.location.href = 'index.html';
    }
}


// READ: Carregar e exibir filmes na tabela
async function carregarFilmes() {
    filmesTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Carregando filmes...</td></tr>';
    try {
        const response = await fetch(API_FILMES_URL);
        if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
        const filmes = await response.json();
        exibirFilmesTabela(filmes);
    } catch (error) {
        console.error('Erro ao carregar filmes para o admin:', error);
        filmesTbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar filmes. Verifique o console.</td></tr>';
    }
}

function exibirFilmesTabela(filmes) {
    filmesTbody.innerHTML = ''; // Limpa o conteúdo existente

    if (filmes.length === 0) {
        filmesTbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum filme cadastrado.</td></tr>';
        return;
    }

    filmes.forEach(filme => {
        const row = document.createElement('tr');
        // Usando ícones Font Awesome para o status de destaque
        const destaqueIcon = filme.destaque ? 
            '<i class="fas fa-check-circle text-success" title="Em Destaque"></i> Sim' : 
            '<i class="fas fa-times-circle text-muted" title="Não em Destaque"></i> Não';

        row.innerHTML = `
            <td>${filme.id}</td>
            <td>${filme.titulo}</td>
            <td>${filme.ano}</td>
            <td>${filme.genero}</td>
            <td>${filme.nota}</td>
            <td>${destaqueIcon}</td>
            <td>
                <button class="btn btn-warning btn-sm me-2" data-id="${filme.id}" onclick="carregarFilmeParaEdicao('${filme.id}')">Editar</button>
                <button class="btn btn-danger btn-sm" data-id="${filme.id}" onclick="excluirFilme('${filme.id}')">Excluir</button>
            </td>
        `;
        filmesTbody.appendChild(row);
    });

    // Removendo os event listeners do querySelectorAll e confiando no onclick (como você usava)
    // Isso é mais simples para manter a compatibilidade com seu código original.
}

// CREATE / UPDATE: Lida com o envio do formulário
async function handleFormSubmit(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const filmeData = {
        titulo: tituloInput.value,
        descricao: descricaoInput.value,
        imagem: imagemInput.value,
        ano: parseInt(anoInput.value),
        genero: generoInput.value,
        nota: parseFloat(notaInput.value),
        destaque: destaqueCheckbox.checked // Captura o valor do checkbox de destaque
    };

    const filmeId = filmeIdInput.value; // Pega o ID do campo oculto

    if (filmeId) {
        // Se tem ID no campo oculto, é uma atualização (PUT)
        await atualizarFilme(filmeId, filmeData);
    } else {
        // Se não tem ID, é um novo filme (POST)
        await adicionarFilme(filmeData);
    }

    limparFormulario(); // Limpa o formulário após salvar
    carregarFilmes(); // Recarrega a lista de filmes
}

// CREATE: Adiciona um novo filme
async function adicionarFilme(filme) {
    try {
        const response = await fetch(API_FILMES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filme)
        });
        if (!response.ok) throw new Error('Falha ao adicionar filme');
        const novoFilme = await response.json(); // Pega o filme retornado com o ID
        alert(`Filme "${novoFilme.titulo}" adicionado com sucesso!`);
    } catch (error) {
        console.error('Erro ao adicionar filme:', error);
        alert('Erro ao adicionar filme. Verifique o console.');
    }
}

// UPDATE: Atualiza um filme existente
async function atualizarFilme(id, filme) {
    try {
        const response = await fetch(`${API_FILMES_URL}/${id}`, {
            method: 'PUT', // PUT para substituir o recurso completo
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filme)
        });
        if (!response.ok) throw new Error('Falha ao atualizar filme');
        const filmeAtualizado = await response.json();
        alert(`Filme "${filmeAtualizado.titulo}" atualizado com sucesso!`);
    } catch (error) {
        console.error('Erro ao atualizar filme:', error);
        alert('Erro ao atualizar filme. Verifique o console.');
    }
}

// Carrega dados de um filme para o formulário de edição
async function carregarFilmeParaEdicao(id) {
    try {
        const response = await fetch(`${API_FILMES_URL}/${id}`);
        if (!response.ok) throw new Error('Filme não encontrado para edição');
        const filme = await response.json();

        filmeIdInput.value = filme.id; // Preenche o campo oculto
        tituloInput.value = filme.titulo;
        descricaoInput.value = filme.descricao;
        imagemInput.value = filme.imagem;
        anoInput.value = filme.ano;
        generoInput.value = filme.genero;
        notaInput.value = filme.nota;
        destaqueCheckbox.checked = filme.destaque || false; // Define o estado do checkbox

        formTitle.textContent = 'Editar Filme'; // Altera o título do formulário
        btnSalvarFilme.textContent = 'Atualizar Filme'; // Altera o texto do botão de salvar
        btnCancelarEdicao.style.display = 'inline-block'; // Mostra o botão de cancelar
    } catch (error) {
        console.error('Erro ao carregar filme para edição:', error);
        alert('Erro ao carregar filme para edição. Verifique o console.');
    }
}

// DELETE: Exclui um filme
async function excluirFilme(id) {
    if (!confirm('Tem certeza que deseja excluir este filme? Esta ação é irreversível!')) {
        return; // Cancela se o usuário não confirmar
    }

    try {
        const response = await fetch(`${API_FILMES_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Falha ao excluir filme');
        alert('Filme excluído com sucesso!');
        carregarFilmes(); // Recarrega a lista após exclusão
    } catch (error) {
        console.error('Erro ao excluir filme:', error);
        alert('Erro ao excluir filme. Verifique o console.');
    }
}

// Limpa o formulário de cadastro/edição e volta para o modo "Adicionar"
function limparFormulario() {
    filmeForm.reset(); // Reseta todos os campos visíveis
    filmeIdInput.value = ''; // Limpa o ID oculto
    formTitle.textContent = 'Adicionar Novo Filme'; // Volta o título do formulário
    btnSalvarFilme.textContent = 'Cadastrar Filme'; // Volta o texto do botão
    btnCancelarEdicao.style.display = 'none'; // Esconde o botão de cancelar
    destaqueCheckbox.checked = false; // Garante que o checkbox seja desmarcado
}

// Exporta funções globais se necessário (não é o caso agora com onclick)
// window.carregarFilmeParaEdicao = carregarFilmeParaEdicao;
// window.excluirFilme = excluirFilme;