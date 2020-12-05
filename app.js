const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const {User} = require('./models');
const {Op} = require('sequelize');
const app = express();
const urlEncoderParser = bodyParser.urlencoded({ extended: false });
app.use(urlEncoderParser);
app.use(helmet());
app.use(express.static('public'));

app.set('view engine', './views');
app.engine('html', require('ejs').renderFile);

const port = 3000;

app.get('/', (req, res) => {
    res.render('index.ejs')
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs')
});

app.post('/signup', urlEncoderParser, async (req,res) => {
    try {
        console.log(req.body)
        const {email, password, username} = req.body
        const [user, created] = await User.findOrCreate({
            where: {[Op.or]: [{username}, {email}]},
            defaults: {
                username,
                email,
                password,
                isAdmin: true,
            }
        })
        if(!created){
            return res.status(400).render('signup.ejs')
        }
        res.status(200).render('signup.ejs')
    } catch (error) {
        console.error('erreur dans le post signup', error)
        res.status(500).render('500.ejs')
    }
});

app.get('/signin', (req, res) => {
    res.render('signin.ejs')
});

app.post('/signin', (req,res) => {
    console.log('Connexion');
    console.log('');
    console.log('Email ->' + req.body.email);
    console.log('Password ->' +req.body.password);
    console.log('');
    res.render('signin.ejs')
});

app.get('/admin', async (req, res) => {

    try {
        const users = await User.findAll();
        console.log('user->', users);
        res.status(200).render('admin.ejs', { users })
    } catch (error) {
        console.error('erreur dans le userfindAll->', error)
        res.status(500).render('500.ejs')
    }
});

app.get('/chat', (req, res) => {
    res.render('chat.ejs')
});


app.listen(port, () => console.log(`Le serveurs est sur le port ${port}`));