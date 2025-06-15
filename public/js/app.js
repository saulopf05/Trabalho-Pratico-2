document.addEventListener('DOMContentLoaded', () => {
  const isIndexPage = document.body.contains(document.getElementById('movie-list'));
  const isDetailsPage = document.body.contains(document.getElementById('movie-details'));

  const API_URL = 'http://localhost:5000/filmes';

  if (isIndexPage) {
    fetch(API_URL)
      .then(response => response.json())
      .then(movies => {
        const movieList = document.getElementById('movie-list');
        const fragment = document.createDocumentFragment();

        movies.forEach(movie => {
          const col = document.createElement('div');
          col.className = 'col-md-3 mb-4';
          col.innerHTML = `
            <div class="card h-100">
              <img src="${movie.imagem}" class="card-img-top" alt="${movie.titulo}" loading="lazy">
              <div class="card-body">
                <h5 class="card-title">${movie.titulo}</h5>
                <p class="card-text">${movie.genero}</p>
                <a href="detalhes.html?id=${movie.id}" class="btn btn-primary">Ver Detalhes</a>
              </div>
            </div>
          `;
          fragment.appendChild(col);
        });

        movieList.appendChild(fragment);
      })
      .catch(error => {
        console.error('Erro ao carregar filmes:', error);
        document.getElementById('movie-list').innerHTML = '<div class="col-12 text-danger">Erro ao carregar filmes.</div>';
      });
  }

  if (isDetailsPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    fetch(`${API_URL}/${movieId}`)
      .then(response => {
        if (!response.ok) throw new Error('Filme não encontrado');
        return response.json();
      })
      .then(movie => {
        const container = document.getElementById('movie-details');
        container.innerHTML = `
          <div class="col-md-4">
            <img src="${movie.imagem}" alt="${movie.titulo}" class="img-fluid rounded" loading="lazy">
          </div>
          <div class="col-md-8">
            <h2>${movie.titulo}</h2>
            <p><strong>Ano:</strong> ${movie.ano}</p>
            <p><strong>Gênero:</strong> ${movie.genero}</p>
            <p>${movie.descricao}</p>
          </div>
        `;
      })
      .catch(error => {
        console.error(error);
        document.getElementById('movie-details').innerHTML =
          '<div class="col-12 text-danger"><h2>Filme não encontrado</h2></div>';
      });
  }
});
