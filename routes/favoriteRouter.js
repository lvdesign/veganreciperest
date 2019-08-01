const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Favorites = require('../models/favorites');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());


// /favorites
favoriteRouter.route('/')
.options( cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

/* 
GET operation on '/favorites'
populate the user information 
and the dishes information before returning 
the favorites to the user
**/
.get( cors.cors, (req,res,next) =>{
    Favorites.find({})
    .populate('user')
    .populate('recipes')
    .then( favorites => {
        res.statusCode= 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
.catch( (err) => next(err));
})

//  /favorites/ dishId
// 
/*
When the user does a POST operation on '/favorites' 
by including [{"_id":"dish ObjectId"}, . . ., {"_id":"dish ObjectId"}] 
in the body of the message, you will 
(a) create a favorite document 
if such a document corresponding to this user does not already exist in the system, 
(b) add the dishes specified in the body of the message to the list 
of favorite dishes for the user, 
if the dishes do not already exists in the list of favorites.
*/
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({'user':req.user._id})
        .then((favorites) => {
            if (favorites != null) {
                var currentRecipes= favorites.recipes;
                var requestRecipes= req.body;
                console.log('CurrentRecipes : ', currentRecipes);
                console.log('RequestRecipes : ', requestRecipes);
                
                favorites.recipes = currentRecipes.concat(requestRecipes.filter(function (el) {
                    return currentRecipes.indexOf(el._id) === -1;
                }));
                favorites.save()
                    .then((favorites)=> {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err));
            }
            else { 
                // (a) create a favorite document 
                // favorites does not exists for the user
                var favoritesDocument = {
                    recipes:req.body,
                    user:req.user._id
                };
                console.log('favoritesDocument :: ', favoritesDocument)
                Favorites.create(favoritesDocument)
                    .then((favorites) => {
                        console.log('Favorites Created ', favorites);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err))
                    .catch((err) => next(err));
            }
        }, (err) => next(err))
        .catch((err) => next(err));

})

.put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})

/*
When the user performs a DELETE operation on '/favorites', 
you will delete the list of favorites corresponding to the user, 
by deleting the favorite document corresponding to this user from the collection.
*/

.delete(cors.corsWithOptions, (req, res, next) => {
    Favorites.remove({})
    .then( resp => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch( (err) => next(err));
});




/* —————————————————————————————————————————————————————— */
// /favorites/:favoriteId/ 

// favoriteRouter.route('/:favoriteId')
// .options( cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

// .get( cors.cors, (req,res,next) =>{
//     Favorites.findById(req.params.favoriteId)

//     .then( favorite => {
//         console.log( 'Favorite get a ', favorite );
//         res.statusCode= 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(favorite);
//     }, (err) => next(err))
// .catch( (err) => next(err));
// });

//




/* ------------------------------------------------------------------------------------*/

/* /favorites/ :dishId 

------------------------------------------------------------------------------------

When the user performs a POST operation on '/favorites/:dishId', 
then you will add the specified dish to the list of the user's list of favorite dishes, 
if the dish is not already in the list of favorite dishes.

 var id1 = favorites.dish.id(req.params.dishId);
    var id2 = req.user._id;
    console.log('id2 =' ,req.user._id);
    console.log('id1 = ', favorites.dish.id(req.params.dishId) );
    console.log( 'req.body =', req.body );
*/
favoriteRouter.route('/:recipeId')
.options(cors.corsWithOptions, (req, res)=>{ res.sendStatus(200);})

.get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /recipes/' + req.params.recipeId);
})

.post( cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {

    Favorites.findOne({'user': req.user._id})
        .then(  favorites => {
            if( favorites != null){
                if( favorites.recipes.indexOf(req.params.recipeId) === -1){
                    favorites.recipes.push(req.params.recipeId)
                    console.log('Favorites Created this one : ', req.params.recipeId);
                }
                favorites.save()
                .then( favorites => {
                    console.log('Favorites Created add : ', favorites);
                    console.log('Favorites Add this one : ', req.params.recipeId);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                }, (err) => next(err));
            }
            else{
                var favoritesDocument = {
                    recipes:[req.params.recipeId],
                    user:req.user._id
                };
                Favorites.create(favoritesDocument)
                    .then((favorites) => {
                        console.log('Favorites Created ', favorites);
                        console.log('Favorites Add this one : ', req.params.recipeId);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err))
                    .catch((err) => next(err));

            }
        }, err => next(err))
        .catch( err => next(err));
   
    
})


// /favorites/  
.put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})



// favorites/ dishId
/*
When the user performs a DELETE operation on '/favorites/:dishId', 
then you remove the specified dish 
from the list of the user's list of favorite dishes.
*/

.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({'user':req.user._id})
        .then((favorites) => {
            if (favorites != null) {
                var index = favorites.recipes.indexOf(req.params.recipeId);
                if(index > -1){
                    favorites.recipes.splice(index, 1);
                    console.log('Favorites delete this : ', index);
                    console.log('Favorites delete this one : ', req.params.recipeId);
                }
                favorites.save()
                    .then((favorites)=> {
                        console.log('Favorites delete ', favorites);
                        
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err));
            }
            else { // favorites does not exists for the user
                var favoritesDocument = {
                    recipes:[],
                    user:req.user._id
                };
                Favorites.create(favoritesDocument)
                    .then((favorites) => {
                        console.log('Favorites new list : ', favorites);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err))
                    .catch((err) => next(err));
            }
        }, (err) => next(err))
        .catch((err) => next(err));
});




module.exports = favoriteRouter;