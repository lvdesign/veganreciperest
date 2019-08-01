var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
const cors = require('./cors');

var authenticate = require('../authenticate');
var router = express.Router();
router.use(bodyParser.json());



/* 
* GET users listing. 
authenticate.verifyUser, authenticate.verifyAdmin,
*/
router.get('/', cors.corsWithOptions, (req, res, next) => {
  User.find({})
  .then( user =>{
    res.statusCode= 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(user);
  }, err => next(err))
  .catch( err => next(err))
  //res.send('respond with a resource toto');
});



/*
* CREATE  a USER : Post new User
*/
router.post('/signup', cors.corsWithOptions, (req, res, next) => {
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {

      if( req.body.firstname)
        user.firstname = req.body.firstname;
      if( req.body.lastname)
        user.lastname = req.body.lastname;

      user.save( (err, user) => {
          
        if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: err});
          }

        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful! '});
        });

      });
     
    }
  });
});


/*
* LOGIN TO THE SITE : Post login an User et creation du Token pour la suite du site
*/
router.post('/login', cors.corsWithOptions, passport.authenticate('local'), (req, res) => {
  
  var token = authenticate.getToken({ _id: req.user._id }); //token creation et retour ds le header
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true, token: token, status: 'You are successfully logged in!'});
});



/*
* LOGOUT : get out the site
*/

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/'); // homePage
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

module.exports = router;
