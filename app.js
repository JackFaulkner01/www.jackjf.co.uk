const http = require("http");
const express = require('express');
require('dotenv').config();

const app = express();
const httpPort = parseInt(process.env.HTTP_PORT);

app.set('view engine', 'ejs');

app.use('/images', express.static('./images'));
app.use('/js', express.static('./js'));
app.use('/styles', express.static('./styles'));
app.use('/favicon.ico', express.static('./favicon.ico'));

http.createServer(app).listen(httpPort, () => {
    console.log(`HTTP app listening on port ${httpPort}`);
});

app.get('/', (req, res) => {
    res.render('portfolio');
});

app.get('/cv', (req, res) => {
    res.render('cv');
});

app.get('/connectfour', (req, res) => {
    res.render('connectfour', {
        server: 'jackjf'
    });
});
