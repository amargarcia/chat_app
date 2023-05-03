//express is the framework we're going to use to handle requests
const express = require("express");

var router = express.Router();

//Access the connection to Heroku Database
const pool = require("../utilities/exports").pool;

const validation = require("../utilities/exports").validation;
let isStringProvided = validation.isStringProvided;

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /demosql Request to add someone's name to the DB
 * @apiName PostDemoSql
 * @apiGroup DemoSql
 *
 * @apiBody {String} name someone's name *unique
 * @apiBody {String} message a message to store with the name
 *
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {String} message the string "Inserted: ***name***" where ***name*** corresponds
 * to the parameter string name.
 *
 * @apiError (400: Name exists) {String} message "Name exists"
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiUse JSONError
 */
router.post("/", (request, response) => {
  if (
    isStringProvided(request.body.name) &&
    isStringProvided(request.body.message)
  ) {
    const theQuery =
      "INSERT INTO DEMO(Name, Message) VALUES ($1, $2) RETURNING *";
    const values = [request.body.name, request.body.message];

    pool
      .query(theQuery, values)
      .then((result) => {
        response.status(201).send({
          success: true,
          message: "Inserted: " + result.rows[0].name,
        });
      })
      .catch((err) => {
        //log the error
        console.log(err);
        if (err.constraint == "demo_name_key") {
          response.status(400).send({
            message: "Name exists",
          });
        } else {
          response.status(400).send({
            message: err.detail,
          });
        }
      });
  } else {
    response.status(400).send({
      message: "Missing required information",
    });
  }
});

/**
 * @api {get} /demosql/:name Request to get all demo entries in the DB
 * @apiName GetDemoSql
 * @apiGroup DemoSql
 *
 * @apiParam {String} [name] the name to look up. If no name provided, all names are returned
 *
 * @apiSuccess {boolean} success true when the name is inserted
 * @apiSuccess {Object[]} names List of names in the Demo DB
 * @apiSuccess {String} names.name The name
 * @apiSuccess {String} names.message The message associated with the name
 *
 * @apiError (404: Name Not Found) {String} message "Name not found"
 *
 * @apiUse JSONError
 */
router.get("/:name?", (request, response) => {
  const theQuery = "SELECT name, message FROM Demo WHERE name LIKE $1";
  let values = [request.params.name];

  //No name was sent so SELECT on all
  if (!isStringProvided(request.params.name)) {
    values = ["%"];
  }

  pool
    .query(theQuery, values)
    .then((result) => {
      if (result.rowCount > 0) {
        response.send({
          success: true,
          names: result.rows,
        });
      } else {
        response.status(404).send({
          message: "Name not found",
        });
      }
    })
    .catch((err) => {
      //log the error
      // console.log(err.details)
      response.status(400).send({
        message: err.detail,
      });
    });
});

/**
 * @api {put} /demosql Request to replace the message entry in the DB for name
 * @apiName PutDemoSql
 * @apiGroup DemoSql
 *
 * @apiBody {String} name the name entry
 * @apiBody {String} message a message to replace with the associated name
 *
 * @apiSuccess {boolean} success true when the name is inserted
 * @apiSuccess {String} message the string "Updated: ***name***" where ***name*** corresponds
 * to the parameter string name.
 *
 * @apiError (404: Name Not Found) {String} message "Name not found"
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiUse JSONError
 */
router.put("/", (request, response) => {
  if (
    isStringProvided(request.body.name) &&
    isStringProvided(request.body.message)
  ) {
    const theQuery = "UPDATE Demo SET message = $1 WHERE name = $2 RETURNING *";
    const values = [request.body.message, request.body.name];

    pool
      .query(theQuery, values)
      .then((result) => {
        if (result.rowCount > 0) {
          response.send({
            success: true,
            message: "Updated: " + result.rows[0].name,
          });
        } else {
          response.status(404).send({
            message: "Name not found",
          });
        }
      })
      .catch((err) => {
        //log the error
        // console.log(err)
        response.status(400).send({
          message: err.detail,
        });
      });
  } else {
    response.status(400).send({
      message: "Missing required information",
    });
  }
});

/**
 * @api {delete} /demosql/:name Request to remove entry in the DB for name
 * @apiName DeleteDemoSql
 * @apiGroup DemoSql
 *
 * @apiParam {String} name the name entry  to delete
 *
 * @apiSuccess {boolean} success true when the name is delete
 * @apiSuccess {String} message the string "Deleted: ***name***" where ***name*** corresponds
 * to the parameter string name.
 *
 * @apiError (404: Name Not Found) {String} message "Name not found"
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiUse JSONError
 */
router.delete("/:name", (request, response) => {
  if (isStringProvided(request.params.name)) {
    const theQuery = "DELETE FROM Demo  WHERE name = $1 RETURNING *";
    const values = [request.params.name];

    pool
      .query(theQuery, values)
      .then((result) => {
        if (result.rowCount == 1) {
          response.send({
            success: true,
            message: "Deleted: " + result.rows[0].name,
          });
        } else {
          response.status(404).send({
            message: "Name not found",
          });
        }
      })
      .catch((err) => {
        //log the error
        // console.log(err)
        response.status(400).send({
          message: err.detail,
        });
      });
  } else {
    response.status(400).send({
      message: "Missing required information",
    });
  }
});

module.exports = router;