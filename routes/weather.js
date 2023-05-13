//express is the framework we're going to use to handle requests
const express = require("express");

//retrieve the router object from express
const router = express.Router();

/**
 * @api {get} /hello Request a Hello World message
 * @apiName GetHello
 * @apiGroup Hello
 *
 * @apiSuccess {String} message the String: "Hello, you sent a GET request"
 */
router.get("/", (request, response) => {
    response.send({
        message: "Hello, you sent a GET request",
    });
});

/**
 * @api {post} /hello Request a Hello World message
 * @apiName PostHello
 * @apiGroup Hello
 *
 * @apiSuccess {String} message the String: "Hello, you sent a POST request"
 */
router.post("/", (request, response) => {
    response.send({
        message: "Hello, you sent a POST request",
    });
});
// "return" the router
module.exports = router;
