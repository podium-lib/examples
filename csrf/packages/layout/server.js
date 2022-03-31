const express = require('express');
const Layout = require('@podium/layout');

const layout = new Layout({
    name: 'myLayout',
    pathname: '/',
});

const podletA = layout.client.register({
    name: 'form',
    uri: 'http://localhost:7100/manifest.json',
});

const podletB = layout.client.register({
    name: 'json',
    uri: 'http://localhost:7200/manifest.json',
});

const podletC = layout.client.register({
    name: 'no-csrf-button',
    uri: 'http://localhost:7300/manifest.json',
});


const app = express();

app.use(layout.middleware());

app.get(layout.pathname(), async (req, res, next) => {
    const incoming = res.locals.podium;

    const [a, b, c] = await Promise.all([
        podletA.fetch(incoming),
        podletB.fetch(incoming),
        podletC.fetch(incoming),
    ]);


    incoming.podlets = [a, b, c];

    // Collect all cookies from each podlet into an array of cookies
    const cookies = [];

    if(Array.isArray(a.headers['set-cookie'])) {
        a.headers['set-cookie'].forEach((cookie) => {
            cookies.push(cookie);
        });
    }

    if(Array.isArray(b.headers['set-cookie'])) {
        b.headers['set-cookie'].forEach((cookie) => {
            cookies.push(cookie);
        });
    }

    if(Array.isArray(c.headers['set-cookie'])) {
        c.headers['set-cookie'].forEach((cookie) => {
            cookies.push(cookie);
        });
    }

    // Set the cookies from the podlets on the response
    res.setHeader('Set-Cookie', cookies);
    
    res.status(200).podiumSend(`
        <div>
            ${a.content}
            <hr>
            ${b.content}
            <hr>
            ${c.content}
        </div>
    `);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal error');
});

app.listen(7000);
