function scrollAndExtractData() {
    const container = document.querySelector('div[data-animate-modal-body="true"]');
    if (!container) return;

    const uniqueContacts = new Map();
    const SCROLL_INTERVAL = 1500; // Intervalo de desplazamiento en milisegundos
    const SCROLL_AMOUNT = 800; // Cantidad de desplazamiento en píxeles

    // Observador de cambios en los estilos (como desplazamientos)
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                extractData();
            }
        });
    });
    const config = { attributes: true, subtree: true, attributeFilter: ['style'] };
    observer.observe(container, config);

    function extractData() {
        const contactHTML = container.querySelectorAll('div[role="gridcell"][aria-colindex="2"]');
        contactHTML.forEach(contact => {
            const nameElement = contact.querySelector('span[title]:not([title="+"])');
            const messageElement = contact.parentNode.querySelector('span.selectable-text.copyable-text');
            const phoneElement = contact.parentNode.querySelector('span[dir="auto"]:not([title])');

            const name = nameElement ? cleanName(nameElement.getAttribute('title')) : 'Unknown';
            const message = messageElement ? messageElement.textContent : 'Message unavailable';
            const phone = phoneElement ? phoneElement.textContent : 'Number unavailable';

            const uniqueKey = `${name}|${message}|${phone}`;
            if (!uniqueContacts.has(uniqueKey)) {
                uniqueContacts.set(uniqueKey, { name, message, phone });
            }
        });
    }

    function cleanName(name) {
        return name.replace(/\u202F/g, '').replace(/\u00A0/g, ' ');
    }

    function scroll() {
        const elements = container.querySelectorAll('*');
        let specificButtonFound = false;

        for (let el of elements) {
            if (el.tagName.toLowerCase() === 'button' && el.getAttribute('tabindex') === "0"
                && el.getAttribute('type') === "button") {
                specificButtonFound = true;
                clearInterval(scrollInterval);  // Detener el intervalo si se encuentra el botón
                observer.disconnect();  // Detener el observador
                exportToCSV(Array.from(uniqueContacts.values()));
                return;
            }
            el.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });
        }

        if (specificButtonFound) {
            clearInterval(scrollInterval);
        }
    }

    const scrollInterval = setInterval(scroll, SCROLL_INTERVAL);

    function exportToCSV(data) {
        const csvHeader = "Phone,Name,Message\n";
        const csvRows = [csvHeader];

        data.forEach(info => {
            const name = info.name.replace(/"/g, '""');
            const message = info.message.replace(/"/g, '""');
            const phone = info.phone.replace(/"/g, '""');
            const row = `${phone},"${name}","${message}"`;
            csvRows.push(row);
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "contact_information.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

scrollAndExtractData();
