//express is the framework we're going to use to handle requests
const express = require("express");
//Create a new instance of express router
var router = express.Router();

const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

/**
 * @api {get} /params Request an message echo with a parameter
 * @apiName GetParams
 * @apiGroup Params
 *
 * @apiQuery {String} name someone's name
 *
 * @apiSuccess {String} message the string "Hello, ***name***! You sent a GET Request" where ***name*** corresponds
 * to the parameter string name.
 *
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 */
router.get("/", (request, response) => {
  if (isStringProvided(request.query.name)) {
    response.send({
      //req.query is a reference to arguments in the POST body
      message: "Hello, " + request.query.name + "! You sent a GET Request",
    });
  } else {
    response.status(400).send({
      message: "Missing required information",
    });
  }
});

/**
 * @api {post} /params Request an message echo with a parameter
 * @apiName PostParams
 * @apiGroup Params
 *
 * @apiBody {String} name someone's name
 *
 * @apiSuccess {String} message the string "Hello, ***name***! You sent a GET Request" where ***name*** corresponds
 * to the parameter string name.
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 */
router.post("/", (request, response) => {
  if (isStringProvided(request.body.name)) {
    response.send({
      //req.body is a reference to arguments in the POST body
      message: "Hello, " + request.body.name + "! You sent a POST Request",
    });
  } else {
    response.status(400).send({
      message: "Missing required information",
    });
  }
});

module.exports = router;