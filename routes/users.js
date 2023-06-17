const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');


const router = express.Router();

router.get('/',
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
        User.find()
            .then(users => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(users);
            })
            .catch(err => next(err));
    });

// post of new user
router.post('/signup', (req, res) => {
    User.register(
        new User({ username: req.body.username }),
        req.body.password,
        (err, user) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.json({ err: err });
            } else {
                if (req.body.firstname) {
                    user.firstname = req.body.firstname;
                }
                if (req.body.lastname) {
                    user.lastname = req.body.lastname;
                }
                user.save(err => {
                    if (err) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ err: err });
                        return;
                    }
                    passport.authenticate('local')(req, res, () => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: true, status: 'Registration Successful!' });
                    });
                });
            }
        }
    );
});

//post of a user logging in
router.post('/login', passport.authenticate('local'), (req, res) => {
    const token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, token: token, status: 'You are successfully logged in!' });
});

// logging out
router.get('/logout', (req, res, next) => {
    //if session exists, destroy session
    // deleting session file
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/'); // redirects user to root path
        // if session doesn't exists
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

module.exports = router;