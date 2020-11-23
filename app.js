const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(express.static('public'));

app.set('view engine', './views');

const port = 3000;

app.get('/', (req, res) => {
    res.render('index.pug')
});

app.get('/signup', (req, res) => {
    res.render('signup.pug')
});

app.get('/signin', (req, res) => {
    res.render('signin.pug')
});

app.post('/signin', (req,res) => {
    console.log(req.body)
});

app.get('/admin', (req, res) => {
    res.render('admin.pug')
});

app.get('/chat', (req, res) => {
    res.render('chat.pug', {language: 'HTML'})
});


app.listen(port, () => console.log(`Le serveur est sur le port ${port}`));