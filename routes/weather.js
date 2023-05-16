// express is the framework we're going to use to handle requests
const express = require("express");
const { getWeatherData } = require("../utilities/weatherUtils");

// retrieve the router object from express
const router = express.Router();

/**
 * @api {get} /hello Request a Hello World message
 * @apiName GetHello
 * @apiGroup Hello
 *
 * @apiSuccess {String} message the String: "Hello, you sent a GET request"
 */

// root weather route
router.get("/:latitude/:longitude", (request, response, next) => {
  // validate input
  const latitude = parseFloat(request.params.latitude);
  const longitude = parseFloat(request.params.longitude);

  if (isNaN(latitude) || isNaN(longitude)) {
    response.status(400).send({
      message: "Malformed parameter. Latitude and longitude must be numbers.",
    });
    return;
  }

  const point = { latitude, longitude };

  getWeatherData(point)
    .then((weatherData) => {
      response.status(200).send({
        timePrepared: new Date().toISOString(),
        properties: weatherData,
      });
    })
    .catch((error) => {
      response.status(500).send({
        message: "An error occurred while fetching weather data.",
        error: error.message,
      });
    });
});

// location weather route

// lat/long weather route

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
