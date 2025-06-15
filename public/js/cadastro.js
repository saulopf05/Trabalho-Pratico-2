const API_URL = 'http://localhost:5000/filmes';
const form = document.getElementById('filme-form');
const tbody = document.getElementById('filmes-tbody');

let editId = null;  // Controle de edição

// Carregar filmes
function carregarFilmes() {
  fetch(API_URL)
    .then(res => res.json())
    .then(filmes => {
      tbody.innerHTML = '';
      filmes.forEach(filme => {
        tbody.innerHTML += `
          <tr>
            <td>${filme.id}</td>
            <td>${filme.titulo}</td>
            <td>${filme.ano}</td>
            <td>${filme.genero}</td>
            <td>${filme.nota}</td>
            <td>
              <button class="btn btn-warning btn-sm" onclick="editarFilme('${filme.id}')">Editar</button>
              <button class="btn btn-danger btn-sm" onclick="deletarFilme('${filme.id}')">Excluir</button>
            </td>
          </tr>
        `;
      });
    });
}

carregarFilmes();

// Cadastrar ou atualizar filme
form.addEventListener('submit', function(e) {
  e.preventDefault();

  const filme = {
    titulo: form.titulo.value,
    descricao: form.descricao.value,
    imagem: form.imagem.value,
    ano: parseInt(form.ano.value),
    genero: form.genero.value,
    nota: parseFloat(form.nota.value)
  };

  if (editId) {
    fetch(`${API_URL}/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filme)
    }).then(() => {
      editId = null;
      form.reset();
      carregarFilmes();
    });
  } else {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filme)
    }).then(() => {
      form.reset();
      carregarFilmes();
    });
  }
});

// Editar
function editarFilme(id) {
  fetch(`${API_URL}/${id}`)
    .then(res => res.json())
    .then(filme => {
      form.titulo.value = filme.titulo;
      form.descricao.value = filme.descricao;
      form.imagem.value = filme.imagem;
      form.ano.value = filme.ano;
      form.genero.value = filme.genero;
      form.nota.value = filme.nota;
      editId = filme.id;
    });
}

// Deletar
function deletarFilme(id) {
  fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  }).then(() => carregarFilmes());
}
