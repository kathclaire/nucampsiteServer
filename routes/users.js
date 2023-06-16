const express = require('express');
const User = require('../models/user');

const router = express.Router();

router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

// post of new user
router.post('/signup', (req, res, next) => {
  // check if user already exists
    User.findOne({username: req.body.username})
    .then(user => {
        if (user) {
            const err = new Error(`User ${req.body.username} already exists!`);
            err.status = 403;
            return next(err);
        } else {
          // if none exist, user/password is created (new doc)
            User.create({
                username: req.body.username,
                password: req.body.password})
            .then(user => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({status: 'Registration Successful!', user: user});
            })
            .catch(err => next(err));
        }
    })
    .catch(err => next(err));// err in the find one method 
});

//post of a user logging in
router.post('/login', (req, res, next) => {
    // check to see if user is already logged in
    // aka if we are already tracking an authenticated session
    if(!req.session.user) {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            const err = new Error('You are not authenticated!');
            res.setHeader('WWW-Authenticate', 'Basic');
            err.status = 401;
            return next(err);
        }
      
        const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
        const username = auth[0];
        const password = auth[1];
      // checking for matching username/password
        User.findOne({username: username})
        .then(user => {
            if (!user) {
                const err = new Error(`User ${username} does not exist!`);
                err.status = 401;
                return next(err);
              // check is password is correct
            } else if (user.password !== password) {
                const err = new Error('Your password is incorrect!');
                err.status = 401;
                return next(err);
            } else if (user.username === username && user.password === password) {
                req.session.user = 'authenticated'; //authenticated
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('You are authenticated!')
            }
        })
        .catch(err => next(err));
      // client is already logged in
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('You are already authenticated!');
    }
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