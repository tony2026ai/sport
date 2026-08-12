const $ = (selector) => document.querySelector(selector);

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const parseLine = (line) => {
    const cells = [];
    let cell = '', quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      if (line[i] === '"' && line[i + 1] === '"') { cell += '"'; i += 1; }
      else if (line[i] === '"') quoted = !quoted;
      else if (line[i] === ',' && !quoted) { cells.push(cell); cell = ''; }
      else cell += line[i];
    }
    cells.push(cell);
    return cells;
  };
  const headers = parseLine(lines.shift());
  return lines.map((line) => Object.fromEntries(parseLine(line).map((value, index) => [headers[index], value])));
}

function displayDate(date) {
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Toronto' }).format(new Date(`${date}T12:00:00`));
}

function shortOpponent(name) {
  return name.replace('Toronto Blue Jays', 'Toronto').replace('Philadelphia', 'Philly').replace('Chicago', 'Chi.').replace('Athletics', 'A\'s');
}

function render(games) {
  const wins = games.filter((game) => game.result === 'W').length;
  const losses = games.filter((game) => game.result === 'L').length;
  const latest = games.at(-1);
  $('#record').textContent = `${wins}–${losses}`;
  $('#games').textContent = games.length;
  $('#percentage').textContent = (wins / games.length).toFixed(3).replace(/^0/, '');
  $('#updated').textContent = displayDate(latest.date).toUpperCase();
  $('#latest-date').textContent = displayDate(latest.date).toUpperCase();
  $('#opponent').textContent = latest.opponent.toUpperCase();
  $('#opponent-score').textContent = latest.opponent_score;
  $('#jays-score').textContent = latest.blue_jays_score;
  $('#innings').textContent = `${latest.innings || 9} INNINGS`;
  $('#latest-note').textContent = `Toronto ${latest.result === 'W' ? 'wins' : 'falls'} ${latest.blue_jays_score}–${latest.opponent_score} ${latest.location === 'Home' ? 'at home' : 'on the road'}`;

  const lastTen = games.slice(-10).reverse();
  const recentWins = lastTen.filter((game) => game.result === 'W').length;
  $('#form-record').textContent = `${recentWins}–${lastTen.length - recentWins} IN LAST 10`;
  $('#form-grid').innerHTML = lastTen.map((game) => `<article class="form-item ${game.result === 'L' ? 'loss' : ''}" title="${game.date}: Toronto ${game.blue_jays_score}, ${game.opponent} ${game.opponent_score}"><span class="wl">${game.result}</span><span class="opp">${shortOpponent(game.opponent)}</span><span class="score">${game.blue_jays_score}–${game.opponent_score}</span></article>`).join('');

  const table = $('#schedule-body');
  const showGames = (query = '') => {
    const shown = [...games].reverse().filter((game) => game.opponent.toLowerCase().includes(query.toLowerCase()));
    table.innerHTML = shown.length ? shown.map((game) => `<tr><td>${displayDate(game.date)}</td><td class="matchup">Toronto <span class="site-pill">${game.location === 'Home' ? 'vs' : '@'}</span> ${game.opponent}</td><td>${game.location}</td><td>${game.blue_jays_score}–${game.opponent_score}</td><td><span class="result-pill ${game.result === 'L' ? 'loss' : ''}">${game.result}</span></td></tr>`).join('') : '<tr><td colspan="5" class="loading">No completed games found.</td></tr>';
  };
  showGames();
  $('#search').addEventListener('input', (event) => showGames(event.target.value));
}

fetch('blue_jays_2026_scores.csv')
  .then((response) => { if (!response.ok) throw new Error('Could not load scores'); return response.text(); })
  .then(parseCsv)
  .then(render)
  .catch(() => { $('#schedule-body').innerHTML = '<tr><td colspan="5" class="loading">Scores are temporarily unavailable.</td></tr>'; $('#latest-date').textContent = 'SCORES UNAVAILABLE'; });
