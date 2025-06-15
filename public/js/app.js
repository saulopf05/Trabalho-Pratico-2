// js/app.js

const API_BASE_URL = 'http://localhost:5000'; // OU 'http://127.0.0.1:5000' se você preferir
const API_FILMES_URL = `${API_BASE_URL}/filmes`;
const API_USUARIOS_URL = `${API_BASE_URL}/usuarios`;
const API_FAVORITOS_URL = `${API_BASE_URL}/favoritos`;

document.addEventListener('DOMContentLoaded', () => {
    // ... (sua chamada existente: controlarMenuNavegacao(); ) ...
    controlarMenuNavegacao(); // Mantenha esta linha aqui, no início do DOMContentLoaded

    const isIndexPage = document.body.contains(document.getElementById('movie-list'));
    const isDetailsPage = document.body.contains(document.getElementById('movie-details'));
    const isFavoritosPage = document.body.contains(document.getElementById('lista-favoritos'));
    // Adicionado para evitar mostrar o modal em páginas de login/cadastro de usuário
    const isLoginPage = document.body.contains(document.getElementById('login-page-content')); 
    const isCadastroUsuarioPage = document.body.contains(document.getElementById('cadastro-form')); 


    if (isIndexPage) {
        carregarFilmesDestaque();
        carregarTodosOsFilmes();
        setupPesquisaFilmes();
        carregarDadosParaGraficoGeneros();
        
        // Chamada da nova função para exibir o pop-up de login
        showLoginSuggestionModal(); 
    }

    if (isDetailsPage) {
        carregarDetalhesFilme();
    }

    if (isFavoritosPage) {
        carregarFilmesFavoritos();
    }
    // ... (restante do seu DOMContentLoaded) ...
});

// --- Mostrar Pop-up de Sugestão de Login ---
function showLoginSuggestionModal() {
    // Verifica se o modal HTML existe na página
    const modalElement = document.getElementById('loginSuggestionModal');
    if (!modalElement) {
        // console.log("Modal de sugestão de login não encontrado nesta página.");
        return; // Sai da função se o modal não existe (ou seja, não é a index.html)
    }

    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    const modalShown = sessionStorage.getItem('loginSuggestionModalShown'); // Flag para não mostrar de novo na mesma sessão

    // Adicionado o check para evitar mostrar modal nas páginas de login/cadastro (caso o app.js seja carregado lá)
    const isLoginPage = document.body.contains(document.getElementById('login-page-content'));
    const isCadastroUsuarioPage = document.body.contains(document.getElementById('cadastro-form'));

    if (
        !usuarioLogado && // Se não houver usuário logado
        !modalShown && // E se o modal ainda não foi exibido nesta sessão
        !isLoginPage && // E não estamos na página de login
        !isCadastroUsuarioPage // E não estamos na página de cadastro de usuário
    ) {
        const loginSuggestionModal = new bootstrap.Modal(modalElement);
        loginSuggestionModal.show();
        sessionStorage.setItem('loginSuggestionModalShown', 'true'); // Marca que o modal foi mostrado nesta sessão
    }
}

// --- Funções de Controle do Menu de Navegação (chamada em todas as páginas) ---
function controlarMenuNavegacao() {
    const authLink = document.getElementById('authLink');
    const linkFavoritos = document.getElementById('linkFavoritos');
    const linkCadastroFilmes = document.getElementById('linkCadastroFilmes');

    // Recuperar informações do usuário logado da sessionStorage
    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));

    if (authLink) {
        if (usuarioLogado && usuarioLogado.id) {
            authLink.innerHTML = `<a class="nav-link" href="#" id="logoutBtn">Sair (${usuarioLogado.nome.split(' ')[0]})</a>`;
            authLink.querySelector('#logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                // Chama a função de logout do login.js (se login.js estiver carregado),
                // caso contrário, faz o logout simplificado aqui.
                if (typeof logoutUser !== 'undefined') { // Verifica se a função existe (se login.js foi carregado)
                    logoutUser();
                } else {
                    sessionStorage.removeItem('usuarioLogado');
                    window.location.reload(); // Recarrega a página para atualizar o menu
                }
            });
            if (linkFavoritos) linkFavoritos.style.display = 'block';

            if (linkCadastroFilmes) {
                if (usuarioLogado.admin) {
                    linkCadastroFilmes.style.display = 'block';
                } else {
                    linkCadastroFilmes.style.display = 'none';
                }
            }
        } else {
            authLink.innerHTML = `<a class="nav-link" href="login.html">Login</a>`;
            if (linkFavoritos) linkFavoritos.style.display = 'none';
            if (linkCadastroFilmes) linkCadastroFilmes.style.display = 'none';
        }
    }
}


// --- Funções para Carrossel de Filmes em Destaque ---
async function carregarFilmesDestaque() {
    try {
        const response = await fetch(`${API_FILMES_URL}?destaque=true`);
        const filmesDestaque = await response.json();
        exibirCarrosselDestaques(filmesDestaque);
    } catch (error) {
        console.error('Erro ao carregar filmes em destaque:', error);
    }
}

function exibirCarrosselDestaques(filmes) {
    const carouselInner = document.getElementById('carouselInner');
    if (!carouselInner) return;

    carouselInner.innerHTML = '';

    if (filmes.length === 0) {
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <div class="d-block w-100 bg-secondary text-white text-center py-5">
                    Nenhum filme em destaque encontrado.
                </div>
            </div>
        `;
        return;
    }

    filmes.forEach((filme, index) => {
        const activeClass = index === 0 ? 'active' : '';
        const carouselItem = `
            <div class="carousel-item ${activeClass}">
                <img src="${filme.imagem}" class="d-block w-100 carousel-img" alt="${filme.titulo}" loading="lazy">
                <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-75 rounded p-3">
                    <h5>${filme.titulo}</h5>
                    <p>${filme.descricao.substring(0, 150)}...</p>
                    <a href="detalhes.html?id=${filme.id}" class="btn btn-primary">Ver Detalhes</a>
                </div>
            </div>
        `;
        carouselInner.innerHTML += carouselItem;
    });
}

// --- Funções para Seção de Cards de Filmes (incluindo pesquisa e favoritos) ---
async function carregarTodosOsFilmes(termoPesquisa = '') {
    const movieList = document.getElementById('movie-list');
    if (!movieList) return;

    try {
        let url = API_FILMES_URL;
        if (termoPesquisa) {
            url += `?q=${encodeURIComponent(termoPesquisa)}`;
        }
        const response = await fetch(url);
        const filmes = await response.json();
        exibirCardsFilmes(filmes);
    } catch (error) {
        console.error('Erro ao carregar todos os filmes:', error);
        movieList.innerHTML = '<div class="col-12 text-danger">Erro ao carregar filmes.</div>';
    }
}

function setupPesquisaFilmes() {
    const campoPesquisa = document.getElementById('campoPesquisa');
    const btnPesquisar = document.getElementById('btnPesquisar');

    if (campoPesquisa && btnPesquisar) {
        btnPesquisar.addEventListener('click', () => {
            carregarTodosOsFilmes(campoPesquisa.value.trim());
        });

        campoPesquisa.addEventListener('input', () => {
            if (campoPesquisa.value.trim() === '') {
                carregarTodosOsFilmes();
            }
        });
        campoPesquisa.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                btnPesquisar.click();
            }
        });
    }
}

async function exibirCardsFilmes(filmes, containerId = 'movie-list') {
    const movieList = document.getElementById(containerId);
    if (!movieList) return;
    movieList.innerHTML = '';

    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    let favoritosDoUsuario = [];
    if (usuarioLogado) {
        try {
            const response = await fetch(`${API_FAVORITOS_URL}?userId=${usuarioLogado.id}`);
            favoritosDoUsuario = await response.json();
        } catch (error) {
            console.error('Erro ao carregar favoritos do usuário:', error);
        }
    }

    if (filmes.length === 0) {
        movieList.innerHTML = '<div class="col-12 text-center text-muted">Nenhum filme encontrado.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    filmes.forEach(filme => {
        const isFavorito = favoritosDoUsuario.some(fav => fav.filmeId === filme.id);
        const favoritoIconClass = isFavorito ? 'fas fa-heart text-danger' : 'far fa-heart';
        const favoritoAction = usuarioLogado ? `<i class="${favoritoIconClass} favorito-icon" data-filme-id="${filme.id}" style="cursor: pointer;"></i>` : '';

        const col = document.createElement('div');
        col.className = 'col-md-3 mb-4';

        col.innerHTML = `
            <div class="card h-100">
                <img src="${filme.imagem}" class="card-img-top" alt="${filme.titulo}" loading="lazy" style="height: 250px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${filme.titulo}</h5>
                    <p class="card-text">${filme.genero}</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <a href="detalhes.html?id=${filme.id}" class="btn btn-primary btn-sm">Ver Detalhes</a>
                        ${favoritoAction}
                    </div>
                </div>
            </div>
        `;
        fragment.appendChild(col);
    });

    movieList.appendChild(fragment);

    // Adiciona event listeners para os ícones de favorito
    if (usuarioLogado) {
        document.querySelectorAll(`#${containerId} .favorito-icon`).forEach(icon => { // Seleciona apenas dentro do container
            icon.addEventListener('click', async (e) => {
                const filmeId = e.target.dataset.filmeId;
                const favExistente = favoritosDoUsuario.find(fav => fav.filmeId === filmeId && fav.userId === usuarioLogado.id);

                if (favExistente) {
                    await fetch(`${API_FAVORITOS_URL}/${favExistente.id}`, { method: 'DELETE' });
                    e.target.classList.remove('fas', 'text-danger');
                    e.target.classList.add('far');
                } else {
                    await fetch(API_FAVORITOS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: usuarioLogado.id, filmeId: filmeId })
                    });
                    e.target.classList.remove('far');
                    e.target.classList.add('fas', 'text-danger');
                }
                // Recarrega os filmes para atualizar o estado dos corações em todos os cards visíveis
                // Dependendo da página, recarrega de forma diferente
                if (isIndexPage) {
                    carregarTodosOsFilmes(document.getElementById('campoPesquisa')?.value.trim() || '');
                } else if (isFavoritosPage) {
                    carregarFilmesFavoritos(); // Recarrega apenas os favoritos
                }
            });
        });
    }
}


// --- Funções para Detalhes do Filme ---
async function carregarDetalhesFilme() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const movieDetailsContainer = document.getElementById('movie-details');

    if (!movieId || !movieDetailsContainer) {
        if (movieDetailsContainer) {
            movieDetailsContainer.innerHTML = '<div class="col-12 text-danger"><h2>Filme não especificado.</h2></div>';
        }
        return;
    }

    try {
        const response = await fetch(`${API_FILMES_URL}/${movieId}`);
        if (!response.ok) throw new Error('Filme não encontrado');
        const movie = await response.json();

        // Verificar status de favorito para o usuário logado
        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
        let favoritoHtml = '';
        if (usuarioLogado) {
            const favResponse = await fetch(`${API_FAVORITOS_URL}?userId=${usuarioLogado.id}&filmeId=${movie.id}`);
            const favoritos = await favResponse.json();
            const isFavorito = favoritos.length > 0;
            const favoritoIconClass = isFavorito ? 'fas fa-heart text-danger' : 'far fa-heart';
            favoritoHtml = `<i class="${favoritoIconClass} favorito-icon-details ms-3" data-filme-id="${movie.id}" style="cursor: pointer; font-size: 1.5em;"></i>`;
        }

        movieDetailsContainer.innerHTML = `
            <div class="col-md-4">
                <img src="${movie.imagem}" alt="${movie.titulo}" class="img-fluid rounded" loading="lazy">
            </div>
            <div class="col-md-8">
                <h2 class="d-flex align-items-center">
                    ${movie.titulo}
                    ${favoritoHtml}
                </h2>
                <p><strong>Ano:</strong> ${movie.ano}</p>
                <p><strong>Gênero:</strong> ${movie.genero}</p>
                <p><strong>Nota:</strong> ${movie.nota}</p>
                <p>${movie.descricao}</p>
            </div>
        `;

        // Adiciona event listener para o ícone de favorito na tela de detalhes
        if (usuarioLogado) {
            document.querySelector('.favorito-icon-details').addEventListener('click', async (e) => {
                const filmeId = e.target.dataset.filmeId;
                const favResponse = await fetch(`${API_FAVORITOS_URL}?userId=${usuarioLogado.id}&filmeId=${filmeId}`);
                const favoritos = await favResponse.json();
                const favExistente = favoritos.length > 0 ? favoritos[0] : null;

                if (favExistente) {
                    await fetch(`${API_FAVORITOS_URL}/${favExistente.id}`, { method: 'DELETE' });
                    e.target.classList.remove('fas', 'text-danger');
                    e.target.classList.add('far');
                } else {
                    await fetch(API_FAVORITOS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: usuarioLogado.id, filmeId: filmeId })
                    });
                    e.target.classList.remove('far');
                    e.target.classList.add('fas', 'text-danger');
                }
            });
        }

    } catch (error) {
        console.error(error);
        if (movieDetailsContainer) {
            movieDetailsContainer.innerHTML = '<div class="col-12 text-danger"><h2>Filme não encontrado</h2></div>';
        }
    }
}


// --- Funções para Visualização Avançada - Gráfico de Filmes por Gênero ---
async function carregarDadosParaGraficoGeneros() {
    const generoChartElement = document.getElementById('generoChart');
    if (!generoChartElement) return;

    try {
        const response = await fetch(API_FILMES_URL);
        const filmes = await response.json();

        const contagemGeneros = {};
        filmes.forEach(filme => {
            const generos = filme.genero.split(',').map(g => g.trim());
            generos.forEach(genero => {
                if (genero) {
                    contagemGeneros[genero] = (contagemGeneros[genero] || 0) + 1;
                }
            });
        });

        const labels = Object.keys(contagemGeneros);
        const data = Object.values(contagemGeneros);

        const ctx = generoChartElement.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Número de Filmes',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao carregar dados para o gráfico:', error);
    }
}

// --- Funções para Filmes Favoritos (nova) ---
async function carregarFilmesFavoritos() {
    const listaFavoritosDiv = document.getElementById('lista-favoritos');
    if (!listaFavoritosDiv) return;
    listaFavoritosDiv.innerHTML = ''; // Limpa o conteúdo anterior

    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) {
        listaFavoritosDiv.innerHTML = '<div class="col-12 text-center text-muted">Você precisa estar logado para ver seus filmes favoritos.</div>';
        return;
    }

    try {
        // Busca os IDs dos filmes favoritos para o usuário logado
        const responseFavoritos = await fetch(`${API_FAVORITOS_URL}?userId=${usuarioLogado.id}`);
        const favoritosDoUsuario = await responseFavoritos.json();

        if (favoritosDoUsuario.length === 0) {
            listaFavoritosDiv.innerHTML = '<div class="col-12 text-center text-muted">Você ainda não marcou nenhum filme como favorito.</div>';
            return;
        }

        // Obtém os detalhes de cada filme favorito
        const promisesFilmes = favoritosDoUsuario.map(fav => fetch(`${API_FILMES_URL}/${fav.filmeId}`).then(res => res.json()));
        const filmesFavoritos = await Promise.all(promisesFilmes);

        // Remove possíveis filmes que não foram encontrados (ex: filme excluído)
        const filmesValidos = filmesFavoritos.filter(filme => filme && filme.id);

        exibirCardsFilmes(filmesValidos, 'lista-favoritos'); // Reutiliza a função de exibição de cards, mas para o container de favoritos

    } catch (error) {
        console.error('Erro ao carregar filmes favoritos:', error);
        listaFavoritosDiv.innerHTML = '<div class="col-12 text-danger">Erro ao carregar seus filmes favoritos.</div>';
    }
}
