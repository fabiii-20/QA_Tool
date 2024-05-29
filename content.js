function extractPageContent() {
    const content = {
        textFields: [],
        ariaLinks: [],
        images: []
    };

    document.querySelectorAll('h1, h2, p, a').forEach(el => {
        content.textFields.push(el.innerText);
    });

    document.querySelectorAll('[aria-label]').forEach(el => {
        content.ariaLinks.push({
            label: el.getAttribute('aria-label'),
            target: el.getAttribute('target')
        });
    });

    document.querySelectorAll('img').forEach(img => {
        content.images.push({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt')
        });
    });

    return content;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        const content = extractPageContent();
        sendResponse(content);
    }
});
