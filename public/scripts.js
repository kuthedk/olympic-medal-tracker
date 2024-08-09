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

(async function () {
  const cachedMedalData = getDataFromLocalStorage('medalData');
  if (cachedMedalData) {
    renderTable(calculatePoints(cachedMedalData));
  } else {
    const spinner = document.getElementById('loading-spinner');
    const table = document.querySelector('table');
    table.classList.add('hidden'); // Hide the table initially
    spinner.style.display = 'block'; // Show the spinner

    const medalData = await fetchMedalData();
    saveDataToLocalStorage('medalData', medalData);
    renderTable(calculatePoints(medalData));

    spinner.style.display = 'none'; // Hide the spinner
    table.classList.remove('hidden'); // Show the table
  }
})();

function saveDataToLocalStorage(key, data) {
  const expiry = Date.now() + 60000; // 1-minute expiry
  localStorage.setItem(key, JSON.stringify({ data, expiry }));
}

function getDataFromLocalStorage(key) {
  const cachedData = JSON.parse(localStorage.getItem(key));
  if (cachedData && cachedData.expiry > Date.now()) {
    return cachedData.data;
  }
  return null;
}

export async function fetchMedalData() {
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

export async function fetchCountryFlags() {
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

export function calculatePoints(data) {
  return data.map(entry => ({
    ...entry,
    points: entry.gold * 25 + entry.silver * 10 + entry.bronze * 4
  })).sort((a, b) => b.points - a.points);
}

function renderTable(data) {
  const tableBody = document.getElementById("medal-table");
  tableBody.innerHTML = "";
  data.forEach((entry, index) => {
    const row = `<tr class="${document.body.classList.contains('light-mode') ? 'light-mode' : ''}">
      <td>${index + 1}</td>
      <td>${entry.country} ${entry.flag ? `<img src="${entry.flag}" alt="${entry.country} flag" class="flag">` : ''}</td>
      <td>${entry.gold.toLocaleString()}</td>
      <td>${entry.silver.toLocaleString()}</td>
      <td>${entry.bronze.toLocaleString()}</td>
      <td>${entry.points.toLocaleString()}</td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}

window.calculatePoints = calculatePoints;
window.fetchMedalData = fetchMedalData;
window.fetchCountryFlags = fetchCountryFlags;
window.renderTable = renderTable;

window.toggleDescription = function toggleDescription() {
  const content = document.getElementById('description-content');
  const chevron = document.getElementById('chevron');
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    chevron.classList.remove('right');
    chevron.classList.add('down');
  } else {
    content.style.display = 'none';
    chevron.classList.remove('down');
    chevron.classList.add('right');
  }
}

window.toggleSection = function toggleSection(id) {
  const section = document.getElementById(id);
  const chevron = document.getElementById(`chevron-${id}`);
  if (section.classList.contains('active')) {
    section.classList.remove('active');
    chevron.classList.remove('down');
    chevron.classList.add('right');
  } else {
    section.classList.add('active');
    chevron.classList.remove('right');
    chevron.classList.add('down');
  }
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
