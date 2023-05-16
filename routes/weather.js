//express is the framework we're going to use to handle requests
const express = require("express");
const { getWeatherData } = require("../utilities/weatherUtils");

//retrieve the router object from express
const router = express.Router();

/**
 * @api {get} /hello Request a Hello World message
 * @apiName GetHello
 * @apiGroup Hello
 *
 * @apiSuccess {String} message the String: "Hello, you sent a GET request"
 */

// root weather route
router.get("/", (request, response, next) => {
        // response.send({
        //     message: "Hello, you sent a GET request",
        // });

        // todo: handler for location -> lat/long (geocoding)
        // https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html

        // validate input
        // if (request.params.latitude === undefined) {
        //     response.status(400).send({
        //         message: "Missing required information: latitude."
        //     });
        // }
        // if (request.params.longitude === undefined) {
        //     response.status(400).send({
        //         message: "Missing required information: longitude."
        //     });
        // }
        // if (isNaN(request.params.latitude)) {
        //     response.status(400).send({
        //         message: "Malformed parameter. latitude must be a number."
        //     });
        // }
        // if (isNaN(request.params.longitude)) {
        //     response.status(400).send({
        //         message: "Malformed parameter. longitude must be a number."
        //     });
        // }
        next();
    }, (request, response) => {
        // const point = { latitude: request.params.latitude, longitude: request.params.longitude };
        const point = { latitude: 47.2529, longitude: -122.4443 };
        getWeatherData(point).then(data => {
            //package and send the results
            response.json({
                timePrepared: (new Date()).toISOString(),
                properties: data
            })
        }).catch(error => {
            // handle error
            response.status(400).send({
                message: error.detail
            });
        });
    }
);

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
