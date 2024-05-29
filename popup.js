// Function to clear stored link results when the page loads
// window.onload = function() {
//   localStorage.removeItem('linkResults');
// };


document.getElementById('doneButton').addEventListener('click', async () => {
  const checkAllLinks = document.getElementById('checkAllLinks').checked;
  const checkBrokenLinks = document.getElementById('checkBrokenLinks').checked;
  const checkLocalLanguageLinks = document.getElementById('checkLocalLanguageLinks').checked;
  const checkAllDetails = document.getElementById('checkAllDetails').checked;


  if (!checkAllLinks && !checkBrokenLinks && !checkLocalLanguageLinks && !checkAllDetails) {
    alert('Please check at least one checkbox.');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.startsWith('chrome://')) {
    alert('This extension cannot be run on chrome:// URLs.');
    return;
  }

let countdownTime = 300; // Set countdown time in seconds (5 minutes)
const countdownElement = document.getElementById('countdown');
countdownElement.style.display = 'block'; // Ensure countdown element is visible
updateCountdown(countdownElement, countdownTime);

const countdownInterval = setInterval(() => {
  countdownTime -= 1;
  updateCountdown(countdownElement, countdownTime);

  if (countdownTime <= 0) {
    clearInterval(countdownInterval);
    countdownElement.textContent = 'Time is up!';
  }
}, 1000);

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: checkLinks,
      args: [checkAllLinks, checkBrokenLinks, checkLocalLanguageLinks, checkAllDetails]
    });

    console.log('Link check result:', result); // Debugging

    if (result) {
      localStorage.setItem('linkResults', JSON.stringify(result));
      clearInterval(countdownInterval);
      countdownElement.textContent= 'Loading compeleted now you can download your files'
      alert('Completed');
    } else {
      alert('No result returned from the link check.');
    }
  } catch (error) {
    clearInterval(countdownInterval);
    countdownElement.textContent='';
    console.error(error);
    alert('An error occurred while checking links.');
  }
});

function updateCountdown(element, time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  element.textContent = `Time remaining: ${minutes}m ${seconds}s`;
}

document.getElementById('previewButton').addEventListener('click', () => {
  const results = JSON.parse(localStorage.getItem('linkResults'));
  if (results) {
    document.getElementById('result').style.display = 'block';
    displayAllLinks(results.allLinks);
    displayBrokenLinks(results.brokenLinks);
    displayLocalLanguageLinks(results.localLanguageLinks);
  } else {
    alert('No data to preview. Please click "Done" first.');
  }
});

document.getElementById('downloadPdfButton').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Function to extract table data
//   function extractTableData(selector) {
//     const rows = Array.from(document.querySelectorAll(`${selector} tr`)).slice(1); // Skip the header row
//     return rows.map(row => {
//         return Array.from(row.cells).map(cell => cell.textContent.trim()); // Trim whitespace
//     }).filter(row => row.every(cell => cell !== '')); // Filter out rows with all empty cells
// }

// Function to extract table data
function extractTableData(selector) {
  const rows = Array.from(document.querySelectorAll(`${selector} tr`)).slice(1); // Skip the header row
  return rows.map(row => {
    return Array.from(row.cells).map(cell => cell.textContent.trim()); // Trim whitespace
  }).filter(row => row.some(cell => cell !== '')); // Filter out rows with at least one non-empty cell
}


  // Adding "All Links" table to the PDF
  doc.text('All Links', 10, 10);
  doc.autoTable({
    head: [['URL', 'Status']],
    body: extractTableData('#allLinksTable'),
    startY: 20
  });

  // Adding "Broken Links" table to the PDF
  let lastY = doc.lastAutoTable.finalY + 10; // Get the Y position after the last table
  doc.text('Broken Links', 10, lastY);
  doc.autoTable({
    head: [['URL', 'Status']],
    body: extractTableData('#brokenLinksTable'),
    startY: lastY + 10
  });

  // Adding "Local Language Links" table to the PDF
  lastY = doc.lastAutoTable.finalY + 10; // Update the Y position again
  doc.text('Local Language Links', 10, lastY);
  doc.autoTable({
    head: [['URL', 'Language String']],
    body: extractTableData('#localLanguageLinksTable'),
    startY: lastY + 10
  });

  doc.save('links_report.pdf');
});


document.getElementById('downloadExcelButton').addEventListener('click', () => {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: "Link Report",
    Subject: "Link Checker",
    Author: "Your Name",
    CreatedDate: new Date()
  };

  // Convert all links to worksheet
  const allLinksData = [["", ""]].concat(
    Array.from(document.querySelectorAll('#allLinksTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
  const allLinksSheet = XLSX.utils.aoa_to_sheet(allLinksData);
  XLSX.utils.book_append_sheet(wb, allLinksSheet, "All Links");

  // Convert broken links to worksheet
  const brokenLinksData = [["", ""]].concat(
    Array.from(document.querySelectorAll('#brokenLinksTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
  const brokenLinksSheet = XLSX.utils.aoa_to_sheet(brokenLinksData);
  XLSX.utils.book_append_sheet(wb, brokenLinksSheet, "Broken Links");

  // Convert local language links to worksheet
  const localLanguageLinksData = [["", ""]].concat(
    Array.from(document.querySelectorAll('#localLanguageLinksTable tr')).map(row => {
      return Array.from(row.cells).map(cell => cell.textContent);
    })
  );
  const localLanguageLinksSheet = XLSX.utils.aoa_to_sheet(localLanguageLinksData);
  XLSX.utils.book_append_sheet(wb, localLanguageLinksSheet, "Local Language Links");

  XLSX.writeFile(wb, 'links_report.xlsx');
});

function displayAllLinks(links) {
  let html = '<table><tr><th>All Links</th><th>Status</th></tr>';
  links.forEach(link => {
    const statusColor = link.status === 200 ? 'green' : 'red';
    const linkClass = link.url.includes('#') ? 'highlighted-link' : ''; // Add class if URL contains '#'
    html += `<tr><td class="${linkClass}">${link.url}</td><td style="color: ${statusColor};">${link.status}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('allLinksTable').innerHTML = html;
}


function displayBrokenLinks(links) {
  let html = '<table><tr><th>Broken Links</th><th>Status</th></tr>';
  links.forEach(link => {
    const statusColor = link.status === 200 ? 'green' : 'red';
    html += `<tr><td>${highlightPercent20(link.url)}</td><td style="color: ${statusColor};">${link.status}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('brokenLinksTable').innerHTML = html;
}

function displayLocalLanguageLinks(links) {
  let html = '<table><thead><tr><th>Links</th><th>Region Specific</th><th>Link Text</th></tr></thead><tbody>';
  links.forEach(link => {
    const linkElement = document.createElement('a');
    linkElement.href = link.url;
    linkElement.textContent = link.text; // Extracting link text from the anchor element
    const linkText = linkElement.innerHTML; // Using innerHTML to get the rendered HTML content of the anchor element
    html += `<tr><td>${link.url}</td><td>${getLocalLanguageString(link.url)}</td><td>${linkText}</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('localLanguageLinksTable').innerHTML = html;
}


function getLocalLanguageString(url) {
  const localLanguageList = [
    'en-us', 'en-au', 'en-ca', 'en-gb', 'en-hk', 'en-ie', 'en-in', 'en-my', 'en-nz', 'en-ph', 'en-sg', 'en-za', 'es-es',
    'es-mx', 'fr-be', 'fr-ca', 'fr-fr', 'it-it', 'ko-kr', 'pt-br', 'de-de', 'ar-sa', 'da-dk', 'fi-fi', 'ja-jp', 'nb-no',
    'nl-be', 'nl-nl', 'zh-cn'
  ];
  for (const language of localLanguageList) {
    if (url.includes(language)) {
      return language;
    }
  }
  return 'unknown';
}

function highlightPercent20(url) {
  return url.replace(/%20/g, '<span style="color: red;">%20</span>');
}

async function checkLinks(checkAllLinks, checkBrokenLinks, checkLocalLanguageLinks, checkAllDetails) {
  const allLinks = [];
  const brokenLinks = [];
  const localLanguageLinks = [];
  const localLanguageList = [
    'en-us', 'en-au', 'en-ca', 'en-gb', 'en-hk', 'en-ie', 'en-in', 'en-my', 'en-nz', 'en-ph', 'en-sg', 'en-za', 'es-es',
    'es-mx', 'fr-be', 'fr-ca', 'fr-fr', 'it-it', 'ko-kr', 'pt-br', 'de-de', 'ar-sa', 'da-dk', 'fi-fi', 'ja-jp', 'nb-no',
    'nl-be', 'nl-nl', 'zh-cn'
  ];

  const links = Array.from(document.querySelectorAll('#primaryArea a')).map(link => ({
    url: link.href,
    text: link.textContent // Adding link text
  }));

  for (const link of links) {
    try {
      const response = await fetch(link.url);
      const status = response.status;

      if (checkAllLinks || checkAllDetails) allLinks.push({ url: link.url, status });

      if ((checkBrokenLinks || checkAllDetails) && (status === 400 || status === 404 || status === 410 || status === 502 || status === 408 || status === 503 || link.url.includes('%20'))) {
        brokenLinks.push({ url: link.url, status });
      }

      if ((checkLocalLanguageLinks || checkAllDetails) && localLanguageList.some(language => link.url.includes(language))) {
        localLanguageLinks.push(link); // Push the entire link object
      }
    } catch (error) {
      console.log(error)
    }
  }

  return { allLinks, brokenLinks, localLanguageLinks };
}



