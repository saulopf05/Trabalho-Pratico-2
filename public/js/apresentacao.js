async function carregarDados() {
  const response = await fetch('http://localhost:5000/filmes'); // ajuste se necessário
  const filmes = await response.json();

  const generos = {};
  
  filmes.forEach(filme => {
    const generosArray = filme.genero.split(',').map(g => g.trim());
    
    generosArray.forEach(genero => {
      if (!generos[genero]) {
        generos[genero] = { quantidade: 0, somaNotas: 0, contagem: 0 };
      }
      generos[genero].quantidade++;
      if (filme.nota) {
        generos[genero].somaNotas += filme.nota;
        generos[genero].contagem++;
      }
    });
  });

  const labels = Object.keys(generos);
  const dadosPizza = labels.map(g => generos[g].quantidade);
  const dadosBarras = labels.map(g => 
    generos[g].contagem ? (generos[g].somaNotas / generos[g].contagem).toFixed(1) : 0
  );

  criarGraficoPizza(labels, dadosPizza);
  criarGraficoBarras(labels, dadosBarras);
}

function criarGraficoPizza(labels, data) {
  const ctxPizza = document.getElementById('graficoPizza').getContext('2d');
  new Chart(ctxPizza, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Distribuição',
        data,
        backgroundColor: ['#ff004f', '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40']
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#f0f0f0' } } }
    }
  });
}

function criarGraficoBarras(labels, data) {
  const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
  new Chart(ctxBarras, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Nota Média',
        data,
        backgroundColor: '#ff004f'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, ticks: { color: '#f0f0f0' }, grid: { color: '#333' } },
        x: { ticks: { color: '#f0f0f0' }, grid: { color: '#333' } }
      },
      plugins: { legend: { labels: { color: '#f0f0f0' } } }
    }
  });
}

// Mapa: Locais dos Filmes
mapboxgl.accessToken = 'pk.eyJ1Ijoic2F1bG9wZjA1IiwiYSI6ImNtYmJiNzl5azBkdzMyam9ldDdubGtlNzEifQ.liv36VJ2G-tG7NMX3MmbaQ';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [-46.6333, -23.5505],
  zoom: 2
});

const locais = [
  { cidade: 'Nova York', coords: [-74.006, 40.7128] },
  { cidade: 'Paris', coords: [2.3522, 48.8566] },
  { cidade: 'Tóquio', coords: [139.6917, 35.6895] },
  { cidade: 'São Paulo', coords: [-46.6333, -23.5505] }
];

locais.forEach(local => {
  new mapboxgl.Marker({ color: '#ff004f' })
    .setLngLat(local.coords)
    .setPopup(new mapboxgl.Popup().setText(local.cidade))
    .addTo(map);
});

// Iniciar
carregarDados();
