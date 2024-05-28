document.getElementById('compare-button').addEventListener('click', async () => {
    const url = document.querySelector('#text-area textarea').value;
    
    if (!url) {
      alert('Please enter a URL.');
      return;
    }
  
    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
  
      const currentPageLinks = Array.from(document.querySelectorAll('a')).map(link => ({
        url: link.href,
        text: link.textContent.trim()
      }));
  
      const fetchedPageLinks = Array.from(doc.querySelectorAll('a')).map(link => ({
        url: link.href,
        text: link.textContent.trim()
      }));
  
      displayComparisonResults(currentPageLinks, fetchedPageLinks);
    } catch (error) {
      console.error('Error fetching URL:', error);
      alert('An error occurred while fetching the URL.');
    }
  });
  
  function displayComparisonResults(currentPageLinks, fetchedPageLinks) {
    let html = '<table><tr><th>Current Page Links</th><th>Fetched Page Links</th></tr>';
    
    for (let i = 0; i < Math.max(currentPageLinks.length, fetchedPageLinks.length); i++) {
      const currentPageLink = currentPageLinks[i] || { url: '', text: '' };
      const fetchedPageLink = fetchedPageLinks[i] || { url: '', text: '' };
  
      html += `<tr><td>${currentPageLink.url}<br>${currentPageLink.text}</td><td>${fetchedPageLink.url}<br>${fetchedPageLink.text}</td></tr>`;
    }
    
    html += '</table>';
    document.getElementById('comparisonResults').innerHTML = html;
  }
  