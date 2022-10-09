const http = require("http")
const https = require("https")
const fs = require("fs")
const express = require('express')
require('dotenv').config()

const app = express()
const httpPort = parseInt(process.env.HTTP_PORT) || 3000;
const httpsPort = parseInt(process.env.HTTPS_PORT) || 4000;
const sslCredentials = {
    key: fs.readFileSync('/etc/letsencrypt/live/www.jackjf.co.uk/privkey.pem', 'utf8'), 
    cert: fs.readFileSync('/etc/letsencrypt/live/www.jackjf.co.uk/fullchain.pem', 'utf8')
}

app.set('view engine', 'ejs')

app.use('/images', express.static('./images'));
app.use('/js', express.static('./js'))
app.use('/styles', express.static('./styles'))

http.createServer(app).listen(httpPort, () => {
    console.log(`HTTP app listening on port ${httpPort}`)
})

https.createServer(sslCredentials, app).listen(httpsPort, () => {
    console.log(`HTTPS app listening on port ${httpsPort}`)
})

app.use((req, res, next) => {
    if (req.protocol === 'http') {
        return res.redirect(301, "https://" + req.headers.host + req.url);
    }

    next()
})

app.get('/', (req, res) => {
    res.render('portfolio')
})

app.get('/cv', (req, res) => {
    res.render('cv');
});

app.get('/webusb', (req, res) => {
    res.render('webusb', {
        server: 'jackjf'
    })
})
