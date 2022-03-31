const eventHandler = (id) => {
    const element = document.querySelector(id);

    const token = element.dataset.token;
    const href = element.dataset.href;

    element.addEventListener('click', (event) => {
        fetch(href, {
            credentials: 'same-origin', // Needed for cookies in the request
            headers: {
                'csrf-token': token // <-- is the csrf token as a header
            },
            method: 'POST',
            body: {
                hello: 'from browser'
            }
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    eventHandler('#json-valid');
    eventHandler('#json-invalid');
});
