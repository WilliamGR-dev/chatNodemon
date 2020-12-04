const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(express.static('public'));

app.set('view engine', './views');
app.engine('html', require('ejs').renderFile);

const port = 3000;

app.get('/', (req, res) => {
    res.render('index.html')
});

app.get('/signup', (req, res) => {
    res.render('signup.html')
});

app.post('/signup', (req,res) => {
    console.log('Inscription');
    console.log('');
    console.log('Email ->' + req.body.user.email);
    console.log('Password ->' +req.body.user.password);
    console.log('Pseudo ->' +req.body.user.nickname);
    console.log('');
    res.render('signup.html')
});

app.get('/signin', (req, res) => {
    res.render('signin.html')
});

app.post('/signin', (req,res) => {
    console.log('Connexion');
    console.log('');
    console.log('Email ->' + req.body.user.email);
    console.log('Password ->' +req.body.user.password);
    console.log('');
    res.render('signin.html')
});

app.get('/admin', (req, res) => {
    res.render('admin.html')
});

app.get('/chat', (req, res) => {
    res.render('chat.html')
});


app.listen(port, () => console.log(`Le serveurs est sur le port ${port}`));