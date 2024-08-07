import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwLeHdH7IZT0WhRCZnzz9ijH9TdY_gfEA",
  authDomain: "olympic-medal-tracker.firebaseapp.com",
  projectId: "olympic-medal-tracker",
  storageBucket: "olympic-medal-tracker.appspot.com",
  messagingSenderId: "443481946432",
  appId: "1:443481946432:web:3d1fd43c7333b307ffe2a5",
  measurementId: "G-EZGKTP52D9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

document.getElementById('dark-mode-toggle').addEventListener('change', toggleDarkMode);
document.getElementById('alvie-mode-toggle').addEventListener('change', function () {
  const usePopulationWeight = this.checked;
  toggleAlvieMode(usePopulationWeight);
});

async function initialize() {
  showSpinner(true);
  try {
    const [medalData, populationData] = await fetchData();
    const globalPopulation = calculateGlobalPopulation(populationData);
    const rankedData = calculatePoints(medalData, populationData, globalPopulation, false);
    renderTable(rankedData, false);
  } catch (error) {
    showError('Error fetching data. Please try again later.');
  } finally {
    showSpinner(false);
  }
}

async function fetchData() {
  const [medalData, populationData] = await Promise.all([fetchMedalData(), fetchPopulationData()]);
  return [medalData, populationData];
}

async function fetchMedalData() {
  try {
    const response = await fetch('https://api.olympics.kevle.xyz/medals');
    const data = await response.json();
    const countryFlags = await fetchCountryFlags();
    return data.results.map(result => ({
      country: result.country.name,
      flag: countryFlags[result.country.iso_alpha_2] || countryFlags[result.country.iso_alpha_3] || countryFlags[result.country.code.toLowerCase()] || '',
      gold: result.medals.gold,
      silver: result.medals.silver,
      bronze: result.medals.bronze
    }));
  } catch (error) {
    console.error('Error fetching medal data:', error);
    return [];
  }
}

async function fetchCountryFlags() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const data = await response.json();
    return data.reduce((acc, country) => {
      acc[country.cca2] = country.flags.png;
      acc[country.cca3] = country.flags.png;
      acc[country.name.common.toLowerCase()] = country.flags.png;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching country flags:', error);
    return {};
  }
}

async function fetchPopulationData() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const data = await response.json();
    return data.reduce((acc, country) => {
      acc[country.name.common] = country.population;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching population data:', error);
    return {};
  }
}

function calculateGlobalPopulation(populationData) {
  return Object.values(populationData).reduce((sum, population) => sum + population, 0);
}

function formatNumberWithSeparator(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPopulation(population) {
  if (population >= 1e9) {
    return (population / 1e9).toFixed(1) + 'B';
  } else if (population >= 1e6) {
    return (population / 1e6).toFixed(1) + 'M';
  } else if (population >= 1e3) {
    return (population / 1e3).toFixed(1) + 'K';
  } else {
    return population.toString();
  }
}

function calculatePoints(data, populationData, globalPopulation, usePopulationWeight = false) {
  return data.map(entry => {
    const basePoints = entry.gold * 25 + entry.silver * 10 + entry.bronze * 4;
    const population = populationData[entry.country];

    if (!population) {
      return null;
    }

    // Calculate population proportion
    const populationProportion = population / globalPopulation;
    const adjustedPoints = basePoints / populationProportion;

    return {
      ...entry,
      points: formatNumberWithSeparator(Math.round(basePoints)),
      adjustedPoints: usePopulationWeight ? formatNumberWithSeparator(adjustedPoints.toFixed(2)) : null,
      population: usePopulationWeight ? formatPopulation(population) : null,
      populationProportion: usePopulationWeight ? populationProportion.toFixed(5) : null
    };
  }).filter(entry => entry !== null)
    .sort((a, b) => {
      if (usePopulationWeight) {
        return parseFloat(b.adjustedPoints.replace(/,/g, '')) - parseFloat(a.adjustedPoints.replace(/,/g, ''));
      } else {
        return parseInt(b.points.replace(/,/g, '')) - parseInt(a.points.replace(/,/g, ''));
      }
    });
}

function renderTable(data, usePopulationWeight) {
  const tableBody = document.getElementById("medal-table");
  const populationHeader = document.querySelector(".population-header");
  const populationFactorHeader = document.querySelector(".population-factor-header");
  const adjustedPointsHeader = document.querySelector(".adjusted-points-header");

  tableBody.innerHTML = "";
  if (usePopulationWeight) {
    populationHeader.classList.remove('hidden');
    populationFactorHeader.classList.remove('hidden');
    adjustedPointsHeader.classList.remove('hidden');
  } else {
    populationHeader.classList.add('hidden');
    populationFactorHeader.classList.add('hidden');
    adjustedPointsHeader.classList.add('hidden');
  }

  data.forEach((entry, index) => {
    const row = `<tr class="${document.body.classList.contains('light-mode') ? 'light-mode' : ''}">
      <td>${index + 1}</td>
      <td>${entry.country} ${entry.flag ? `<img src="${entry.flag}" alt="${entry.country} flag" class="flag">` : ''}</td>
      <td>${formatNumberWithSeparator(entry.gold)}</td>
      <td>${formatNumberWithSeparator(entry.silver)}</td>
      <td>${formatNumberWithSeparator(entry.bronze)}</td>
      <td>${entry.points}</td>
      ${usePopulationWeight ? `<td>${entry.population}</td><td>${entry.populationProportion}</td><td>${entry.adjustedPoints}</td>` : ''}
    </tr>`;
    tableBody.innerHTML += row;
  });
}

function showSpinner(show) {
  const spinner = document.getElementById('loading-spinner');
  const table = document.querySelector('table');
  if (show) {
    table.classList.add('hidden');
    spinner.style.display = 'block';
  } else {
    spinner.style.display = 'none';
    table.classList.remove('hidden');
  }
}

function showError(message) {
  const tableBody = document.getElementById("medal-table");
  tableBody.innerHTML = `<tr><td colspan="8">${message}</td></tr>`;
}

function toggleDarkMode() {
  const elementsToToggle = [
    document.body,
    document.querySelector('header'),
    document.querySelector('.container'),
    document.querySelector('.description'),
    document.querySelector('.credits')
  ];

  elementsToToggle.forEach(el => el.classList.toggle('dark-mode'));
  elementsToToggle.forEach(el => el.classList.toggle('light-mode'));

  document.querySelectorAll('th').forEach(th => {
    th.classList.toggle('dark-mode');
    th.classList.toggle('light-mode');
  });
  document.querySelectorAll('tr:nth-child(even)').forEach(tr => {
    tr.classList.toggle('dark-mode');
    tr.classList.toggle('light-mode');
  });
  document.querySelectorAll('td').forEach(td => {
    td.classList.toggle('light-mode');
  });
}

function toggleAlvieMode(usePopulationWeight) {
  (async function () {
    showSpinner(true);
    try {
      const [medalData, populationData] = await fetchData();
      const globalPopulation = calculateGlobalPopulation(populationData);
      const rankedData = calculatePoints(medalData, populationData, globalPopulation, usePopulationWeight);
      renderTable(rankedData, usePopulationWeight);
    } catch (error) {
      showError('Error fetching data. Please try again later.');
    } finally {
      showSpinner(false);
    }
  })();
}

window.calculatePoints = calculatePoints;
window.fetchMedalData = fetchMedalData;
window.fetchCountryFlags = fetchCountryFlags;
window.renderTable = renderTable;
window.fetchPopulationData = fetchPopulationData;

window.toggleDescription = function toggleDescription() {
  const content = document.getElementById('description-content');
  const chevron = document.getElementById('chevron');
  const isHidden = content.style.display === 'none' || content.style.display === '';
  content.style.display = isHidden ? 'block' : 'none';
  chevron.classList.toggle('right', !isHidden);
  chevron.classList.toggle('down', isHidden);
};

window.toggleSection = function toggleSection(id) {
  const section = document.getElementById(id);
  const chevron = document.getElementById(`chevron-${id}`);
  const isActive = section.classList.contains('active');
  section.classList.toggle('active', !isActive);
  chevron.classList.toggle('right', isActive);
  chevron.classList.toggle('down', !isActive);
};

initialize();
