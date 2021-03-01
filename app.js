///Variable Globale
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const {User} = require('./models');
const {Op} = require('sequelize');
const app = express();
const urlEncoderParser = bodyParser.urlencoded({ extended: false });
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const {emailRegex, usernameRegex, passwordRegex} = require('./helpers/regex');
const port = process.env.APP_PORT ? process.env.APP_PORT : 4080;
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.use(urlEncoderParser);
//app.use(helmet());
app.use(express.static('public'));

app.set('view engine', './views');
app.engine('html', require('ejs').renderFile);

app.use(
    session({
        secret: 'UnePhraseSecrete',
        resave: false,
        saveUninitialized: false,

    }),
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) =>{
    done(null,user)
});
passport.deserializeUser((user,done) => {
    done(null,user)
});

passport.use(
    new LocalStrategy(
        async (username, password, done) => {
            try {
                const user = await User.findOne({
                    where: {username}
                });
                if(!user || (user.password !== password)){
                    return done(null, false, {
                        success: false,
                        message: "Mauvais identifiants"
                    })
                }
                return done(null, user)
            }catch (error) {
                return done(error)
            }
        }
    )
)

app.get('/', (req, res) => {
    res.status(200).render('index.ejs', {
        user: req.user,
    })
});

app.get('/signup', (req, res) => {
    if (req.user) return res.redirect('/');
    res.status(200).render('signup.ejs', {
        alerte: false,
        oldInput: false,
        user: req.user,
        editUser: false,
    })
});

app.post('/signup', urlEncoderParser, async (req,res) => {
    if (req.user) return res.redirect('/');
    console.log('Inscription');
    console.log('');
    console.log('Email ->' + req.body.email);
    console.log('Username ->' + req.body.username);
    console.log('Password ->' +req.body.password);
    console.log('');
    try {
        console.log(req.body);
        const {email, password, username} = req.body;

        if (!email.match(emailRegex)){
            return res.status(400).render('signup.ejs', {
                alerte: {
                    class: 'alert-danger',
                    message: "Votre email n'est pas valide"
                },
                oldInput: {
                    oldEmail: email,
                    oldUsername: username,
                }
            });
        }
        if (!username.match(usernameRegex)){
            return res.status(400).render('signup.ejs', {
                alerte: {
                    class: 'alert-danger',
                    message: "Votre nom d'utilisateur n'est pas valide"
                },
                oldInput: {
                    oldEmail: email,
                    oldUsername: username,
                },
            });
        }

        if (!password.match(passwordRegex)){
            return res.status(400).render('signup.ejs', {
                alerte: {
                    class: 'alert-danger',
                    message: "Votre mot de passe n'est pas valide"
                },
                oldInput: {
                    oldEmail: email,
                    oldUsername: username,
                },
            });
        }

        const [user, created] = await User.findOrCreate({
            where: {[Op.or]: [{username}, {email}]},
            defaults: {
                username,
                email,
                password,
                isAdmin: false,
            }
        });
        if(!created){
            return res.status(400).render('signup.ejs', {
                alerte: {
                    class: 'alert-danger',
                    message: "Votre compte ne c'est pas enregistrer correctement"
                },
                oldInput: {
                    oldEmail: email,
                    oldUsername: username,
                },
                user: false,
                editUser: false,
            })
        }
        res.status(200).render('signup.ejs', {
            alerte: {
                class: 'alert-success',
                message: "Votre compte a etait creer correctement"
            },
            oldInput: false,
            user: false,
            editUser: false,
        })
    } catch (error) {
        console.error('erreur dans le post signup', error);
        res.status(500).render('500.ejs')
    }
});

app.get('/signin', (req, res) => {
    if (req.user) return res.redirect('/');
    res.status(200).render('signin.ejs', {
        user: req.user,
        alerte: false,
    })
});

app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', successRedirect: "/chat" }));

app.get('/admin', async (req, res) => {

    try {
        if (!req.user){
            return res.status(200).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Veuillez vous connecter"
                }
            })
        }
        if (!req.user.isAdmin){
            return res.status(200).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Vous n'etes pas admin"
                }
            })
        }
        const users = await User.findAll();
        res.status(200).render('admin.ejs', { users, user: req.user, alerte: false, })
    } catch (error) {
        console.error('erreur dans le userfindAll->', error)
        res.status(500).render('500.ejs')
    }
});

app.get('/profil', async (req, res) => {

    try {
        if (!req.user){
            return  res.status(200).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Veuillez vous connecter"
                }
            })
        }

        const userId = req.user.id
        const user = await User.findByPk(userId)
        if(!user) return res.render('404.ejs')

        const users = [user];
        res.status(200).render('admin.ejs', { users, user: req.user, alerte: false, })
    } catch (error) {
        console.error('erreur dans le userfindAll->', error)
        res.status(500).render('500.ejs')
    }
});

app.get('/admin/destroy/:userId', async (req,res) => {
    try {
        if (!req.user){
            return res.status(400).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Veuillez vous connecter"
                }
            })
        }
        if (!req.user.isAdmin){
            return res.status(400).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Vous n'etes pas admin"
                }
            });
        }
        const userId = req.params.userId;
        const user = await User.findByPk(userId);
        if(!user){
            return res.render('404.html')
        }
        user.destroy();
        const users = await User.findAll();
        return res.status(200).render('admin.ejs', { users, user: req.user, alerte: {
                class: "alert-success",
                message: "Compte Supprimer"
            } });

    }
    catch (error) {
        console.error('erreur dans le post signup', error);
        res.status(500).render('500.ejs')
    }

});

app.get('/profil/destroy/:userId', async (req,res) => {
    try {
        if (!req.user){
            return res.status(400).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Veuillez vous connecter"
                }
            })
        }
        const userId = req.params.userId;
        if (userId != req.user.id && !req.user.isAdmin){
            return res.status(400).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Vous etes pas admin"
                }
            })
        }
        const user = await User.findByPk(userId);
        if(!user){
            return res.render('404.ejs')
        }
        user.destroy();
        req.logout();
        return res.status(200).render('signin.ejs', {
            user: req.user,
            alerte: {
                class: "alert-success",
                message: "Compte Supprimer"
            },
        });

    }
    catch (error) {
        console.error('erreur dans le post signup', error);
        res.status(500).render('500.ejs')
    }

});

app.get('/admin/edit/:userId', async (req,res) => {
    try {
        if (!req.user){
            return res.status(400).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Veuillez vous connecté"
                }
            })
        }
        if (!req.user.isAdmin){
            return res.status(400).render('signin.ejs', {
                user: req.user,
                alerte: {
                    class: "alert-danger",
                    message: "Vous etes pas admin"
                }
            })
        }
        const userId = req.params.userId;
        const user = await User.findByPk(userId);
        if(!user){
            return res.render('404.ejs')
        }
        return res.render('signup.ejs', {
            editUser: user,
            user: req.user,
            oldInput: false,
            alerte: false,
        })


    }
    catch (error) {
        console.error('erreur dans le post signup', error);
        res.status(500).render('500.ejs')
    }

});

app.get('/profil/edit/:userId', async (req,res) => {
    try {
        if (!req.user){
            return res.redirect('/signin', {
                alerte: {
                    class: "alert-danger",
                    message: "Veuillez vous connectez"
                },
            });
        }
        const userId = req.params.userId;
        if (userId != req.user.id && !req.user.isAdmin){
            return res.redirect('/');
        }
        const user = await User.findByPk(userId);
        if(!user){
            return res.render('404.ejs')
        }
        return res.render('signup.ejs', {
            editUser: user,
            user: req.user,
            oldInput: false,
            alerte: false,
        })


    }
    catch (error) {
        console.error('erreur dans le post signup', error);
        res.status(500).render('500.ejs')
    }

});

app.post('/edit/:userId', urlEncoderParser, async (req,res) => {
    try {
        if (!req.user) return res.redirect('/');
        console.log(req.user);
        console.log(req.body);
        const userId = req.params.userId;
        if (userId != req.user.id && !req.user.isAdmin){
            return res.redirect('/');
        }
        const user = await User.findByPk(userId);
        if(!user) return res.render('404.ejs');

        const {email, password, username, admin} = req.body;



        if (email !== ""){
            if (!email.match(emailRegex)){
                return res.status(400).render('signup.ejs', {
                    alerte: {
                        class: 'alert-danger',
                        message: "Votre email n'est pas valide"
                    },
                    oldInput: {
                        oldEmail: email,
                        oldUsername: username,
                    },
                    user: req.user,
                    editUser: {
                        id: userId,
                    },
                });
            }
        }

        if (username !== ""){
            if (!username.match(usernameRegex)){
                return res.status(400).render('signup.ejs', {
                    alerte: {
                        class: 'alert-danger',
                        message: "Votre nom d'utilisateur n'est pas valide"
                    },
                    oldInput: {
                        oldEmail: email,
                        oldUsername: username,
                    },
                    user: req.user,
                    editUser: {
                        id: userId,
                    },
                });
            }
        }

        if (password !== ""){
            if (!password.match(passwordRegex)){
                return res.status(400).render('signup.ejs', {
                    alerte: {
                        class: 'alert-danger',
                        message: "Votre mot de passe n'est pas valide"
                    },
                    oldInput: {
                        oldEmail: email,
                        oldUsername: username,
                    },
                    user: req.user,
                    editUser: {
                        id: userId,
                    },
                });
            }
        }

        if (email !== ""){
            user.email = email;
            await user.save();
        }

        if (username !== ""){
            user.username = username;
            await user.save();
        }

        if (password !== ""){
            user.password = password;
            await user.save();
        }

        if (req.user.isAdmin){
            if (admin === "false"){
                user.isAdmin = false;
            }
            else {
                user.isAdmin = true;
            }
            await user.save();
        }

        if (req.user.isAdmin){
            const users = await User.findAll();
            console.log('user->', users);
            return res.status(200).render('admin.ejs', { users, user: req.user, alerte: {
                    class: "alert-success",
                    message: "Profil mis a jour"
                },
                }
                )
        }
        else {
            const userId = req.user.id
            const user = await User.findByPk(userId)
            if(!user) return res.render('404.ejs')

            const users = [user];
            return res.status(200).render('admin.ejs', { users, user: req.user,alerte: {
                    class: "alert-success",
                    message: "Profil mis a jour"
                }, })
        }


    } catch (error) {
        console.error('erreur dans le post signup', error);
        res.status(500).render('500.ejs')
    }
});

app.get('/chat', (req, res) => {
    if (!req.user) return res.redirect('/');
    res.status(200).render('chat.ejs', {
        user: req.user,
    })
});

app.get('/signout', (req, res) => {
    if (!req.user) return res.redirect('/');
    req.logout();
    res.status(200).render('signin.ejs', {
        user: req.user,
        alerte: {
            class: "alert-info",
            message: "Au revoir"
        },
    })
});

io.on('connection', (socket) => {
    socket.emit('chat','Bienvenue beau gosse');
    socket.broadcast.emit('chat','Oe oe oe un gars en +')
})


http.listen(port, () => console.log(`Le serveurs est sur le port ${port}`));