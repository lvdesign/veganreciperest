const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Recipes = require('../models/recipes');
const authenticate = require('../authenticate');
const cors = require('./cors');

const recipeRouter = express.Router();
recipeRouter.use(bodyParser.json());


/**
 *  GET  /recipes             all body
 *  */
recipeRouter.route('/')
.options( cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

.get( cors.cors, (req, res, next) => {
    Recipes.find({})
    .populate('comments.author')
        .then( recipes => {
            res.statusCode= 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(recipes);
        }, (err) => next(err))
    .catch( (err) => next(err));
})

/**
 *  Post  /recipes  USER
 */
.post( cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Recipes.create( req.body )
    .then( recipe => {
        console.log( 'recipees Created a ', recipe );
            res.statusCode= 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(recipe);
    }, (err) => next(err))
    .catch( (err) => next(err));
    //res.end('Will add the recipe: ' + req.body.name + ' with details: ' + req.body.description);
})

/**
 *  PUT /recipes NO access
 */
.put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /recipes');
})

/**
 *  DELETE  /recipes -> user
 */
.delete( cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Recipes.remove({})
    .then( resp => {
        res.statusCode= 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
   
    //res.end('Deleting all recipes');
}, (err) => next(err))
.catch( (err) => next(err));
});


//  /recipes/id

/**
 *  GET /recipes/recipeId  all body
 */
recipeRouter.route('/:recipeId')
.options( cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

.get(cors.cors, (req, res, next) => {
    Recipes.findById(req.params.recipeId)
    .populate('comments.author')
    .then( recipe => {
        console.log( 'recipe get a ', recipe );
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(recipe);
    }, (err) => next(err))
    .catch( (err) => next(err));
    //res.end('Will send details of the recipe: ' + req.params.id + ' to you!');
})

/**
 *  POST /recipes/recipeId  NO
 */
.post( cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /recipes/'+ req.params.recipeId);
})


/**
 *  PUT /recipes/recipeId  User
 */
.put( cors.corsWithOptions,authenticate.verifyUser, (req, res, next) => {
    Recipes.findByIdAndUpdate(req.params.recipeId, {
        $set: req.body
    }, { new: true})
    .then( recipe => {
        console.log( 'recipe Put ', recipe );
            res.statusCode= 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(recipe);
    }, (err) => next(err))
    .catch( (err) => next(err));

    // res.write('Updating the recipe: ' + req.params.id + '\n');
    // res.end('Will update the recipe: ' + req.body.name +
    //     ' with details: ' + req.body.description);
})
// {"name":"toto",  "description":"Admin"}

/**
 *  DELETE /recipes/recipeId  USER
 */
.delete( cors.corsWithOptions,authenticate.verifyUser, (req, res, next) => {
    Recipes.findByIdAndRemove(req.params.recipeId)
        .then( resp => {
            console.log( 'recipe delete this ', recipe );
            res.statusCode= 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
       
        //res.end('Deleting all recipees');
    }, (err) => next(err))
    .catch( (err) => next(err));
    //res.end('Deleting recipe: ' + req.params.id);
});




/* comments_____________________________________________________________________ */

/**
 *  GET /recipes/recipeId/comments  all body
 */
recipeRouter.route('/:recipeId/comments')
.options( cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

.get(cors.cors, (req, res, next) => {
    Recipes.findById(req.params.recipeId)
    .populate('comments.author')
        .then( recipe => {

            if( recipe != null){ // recipe exist
                res.statusCode= 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(recipe.comments);
            }
            else{
                err =new Error( 'recipe' + req.params.recipeId + 'not found')
                err.status = 404;
                return next(err);
            }
        }, (err) => next(err))
    .catch( (err) => next(err));
})

/**
 *  POST /recipes/recipeId/comments  USER
 */
.post( cors.corsWithOptions, authenticate.verifyUser,(req, res, next) => {
    Recipes.findById(req.params.recipeId)
    .then( recipe => {
        if( recipe != null){ // recipe exist
            
            console.log('-> req.body.author ::: ', req.body.author )
            req.body.author = req.user._id; // car auteur verifié
            recipe.comments.push(req.body); // recuper le body à poster
            recipe.save()
                .then( recipe => {
                    Recipes.findById(recipe._id)
                        .populate('comments.author')
                        .then( recipe => {
                            res.statusCode= 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(recipe);
                            console.log( 'comment du recipe poste', recipe);

                        })
                   
                }, (err) => next(err));            
        }
        else{
            err =new Error( 'recipe comment no ' + req.params.recipeId + 'not found')
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch( (err) => next(err));
    //res.end('Will add the recipe: ' + req.body.name + ' with details: ' + req.body.description);
})

/**
 *  PUT /recipes/recipeId/comments  NO
 */
.put(cors.corsWithOptions, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT for Comments operation are not supported on /recipes/' +req.params.recipeId + '/comments');
})

/**
 *  DELETE /recipes/recipeId/comments  USER
 */
.delete( cors.corsWithOptions, authenticate.verifyUser,(req, res, next) => {
    Recipes.findById(req.params.recipeId)
    .then( recipe => {
        if( recipe != null){ // recipe exist
           for ( var i = ( recipe.comments.length -1); i >=0; i-- ){ 
            recipe.comments.id(recipe.comments[i]._id).remove();
                } 
                recipe.save()
                .then( recipe => {
                    res.statusCode= 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(recipe);
                    console.log( 'ce comment du recipe is deleted', recipe);
                }, (err) => next(err)); 
        }
        else{
            err =new Error( 'recipe comment no ' + req.params.recipeId + 'not found')
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch( (err) => next(err));
})



/* :commentId _____________________________________________________________________ */

/**
 *  GET /recipes/recipeId/comments/:commentId  All body
 */
recipeRouter.route('/:recipeId/comments/:commentId')
.options( cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

.get( cors.cors, (req,res,next) => {
    Recipes.findById(req.params.recipeId)
    .populate('comments.author')
    .then((recipe) => {
        if (recipe != null && recipe.comments.id(req.params.commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(recipe.comments.id(req.params.commentId));
        }
        else if (recipe == null) {
            err = new Error('recipe ' + req.params.recipeId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

/**
 *  POST /recipes/recipeId/comments/:commentId  NO
 */
.post( (req, res, next) => {
    res.statusCode = 403;
    res.end('Attention :: POST operation not supported on /recipes/'+ req.params.recipeId + '/comments/' +req.params.commentId);
})


/**
 *  PUT /recipes/recipeId/comments/:commentId  USER 
 *  si pas meme comments.author pas possible
 */
.put( authenticate.verifyUser,(req, res, next) => {
    Recipes.findById(req.params.recipeId)
    .then((recipe) => {

        var id1 = recipe.comments.id(req.params.commentId).author;
        var id2 = req.user._id;
        console.log('-- id1 = ', recipe.comments.id(req.params.commentId).author);
        console.log('--- id2 = ' , req.user._id );

        // id1 et id2 equal
        if ( recipe != null && recipe.comments.id(req.params.commentId) != null && id1.equals(id2) ) {
            console.log('ids are equals');
            if (req.body.rating) {
                recipe.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                recipe.comments.id(req.params.commentId).comment = req.body.comment;                
            }
            recipe.save()
            .then((recipe) => {
                Recipes.findById(recipe._id)
                .populate('comments.author')
                .then( recipe => { // car update
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(recipe);      

                })
                          
            }, (err) => next(err));
        }
        else if (recipe == null) {
            err = new Error('recipe ' + req.params.recipeId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if (!id1.equals(id2)) {
            err = new Error('recipe user' + id1 + 'est differenet de ' + id2 );
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})


/**
 *  DELETE /recipes/recipeId/comments/:commentId  USER 
 *  si pas meme comments.author pas possible
 */
.delete( authenticate.verifyUser, (req, res, next) => {
    Recipes.findById(req.params.recipeId)
    .then((recipe) => {
        if (recipe != null && recipe.comments.id(req.params.commentId) != null) {
            recipe.comments.id(req.params.commentId).remove();
            recipe.save()
            .then((recipe) => {
                Recipes.findById(recipe._id)
                .populate('comments.author')
                .then( recipe => { //
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(recipe);      
                })
                          
            }, (err) => next(err));
        }
        else if (recipe == null) {
            err = new Error('recipe ' + req.params.recipeId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = recipeRouter;