const links = Array.from(document.querySelectorAll('a')).map(link => ({
    url: link.href,
    text: link.textContent 
  }));
//Here we can change the required id name or classname to skip UHF



