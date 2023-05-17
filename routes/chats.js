//express is the framework we're going to use to handle requests
const express = require('express')
const req = require('express/lib/request')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /chats Request to add a chat
 * @apiName PostChats
 * @apiGroup Chats
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} name the name for the chat
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {Number} chatId the generated chatId
 * 
 * @apiError (400: Unknown user) {String} message "unknown email address"
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiError (400: Unknow Chat ID) {String} message "invalid chat id"
 * 
 * @apiUse JSONError
 */
 router.post("/", (request, response, next) => {
    console.log('POST request to add a chat')
    if (!request.body.name) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response) => {

    let insert = `INSERT INTO Chats(Name)
                  VALUES ($1)
                  RETURNING ChatId`
    let values = [request.body.name]
    pool.query(insert, values)
        .then(result => {
            response.send({
                sucess: true,
                chatID: result.rows[0].chatid
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })

        })
})


/**
 * @api {put} /chats/:chatId? Request add a user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 * 
 * @apiDescription Adds list of members to chat
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to add the user to
 * 
 * @apiSuccess {boolean} success true when the name is inserted
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user already joined"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */
router.put("/:chatId?/", (request, response, next) => {
    console.log("PUT /chats/" + request.params.chatId);
    console.log("Members body: " + request.body);

    //validate on empty parameters
    if (!request.params.chatId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a zzz number"
        })
    } else if (!request.body.members) {
        response.status(400).send({
            message: "Missing members body, Example members: [1, 2, 3]"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.params.chatId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    console.log("Getting existing members");
    // check which members exist
    let query = 'SELECT MemberID FROM ChatMembers WHERE ChatId=$1'
    let values = [request.params.chatId]
    var existingMembers = [];
    pool.query(query, values)
        .then(result => {
            result.rows.forEach(entry =>
                existingMembers.push(entry.memberid)
            );


            console.log("Members: " + request.body.members);
            let addingMembers = request.body.members;
            console.log("Current members in chat: " + existingMembers);
            console.log("Members trying to add in chat: " + addingMembers);
            // 2. Filter between the members already and the ones aren't
            const notInChatMembers = addingMembers.filter(function (x) {
                return existingMembers.indexOf(x) < 0;
            });

            
            console.log("Not in chat: " + notInChatMembers);

            var i = 0;
            // Add all the notInChatMembers to chat
            for (i = 0; i < notInChatMembers.length; i++) {

                console.log("Adding: " + notInChatMembers[i]);
                //Insert the memberId into the chat
                let insert2 = `INSERT INTO ChatMembers(ChatId, MemberId)
                  VALUES ($1, $2)
                  RETURNING *`
                let values2 = [request.params.chatId, notInChatMembers[i]]
                pool.query(insert2, values2)
                    .then(result => {
                        console.log("Success added " + notInChatMembers[i]);
                    }).catch(err => {
                        response.status(400).send({
                            message: "SQL Error, 1",
                            error: err
                        })
                    })
            }
            // TODO call some backend method that sends a notification
            response.send({
                success: true
            })

        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});


/**
 * @api {get} /chats/viewmembers/:chatId?
 * Request to get all members (email, username, id) from a given chatid
 * @apiName GetChats
 * @apiGroup Chats
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {Number} chatId the chat to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of messages returned
 * @apiSuccess {Object[]} members List of members in the chat
 * @apiSuccess {String} messages.email The email for the member in the chat
 * 
 * @apiError (404: ChatId Not Found) {String} message "Chat ID Not Found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */
router.get("/viewmembers/:chatId", (request, response, next) => {
    console.log("GET /viewmembers/" + request.params.chatId);
    //validate on missing or invalid (type) parameters
    if (!request.params.chatId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.params.chatId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response) => {
    //REtrive the members
    let query = `SELECT Members.Email, Members.Username, Members.MemberID
                    FROM ChatMembers
                    INNER JOIN Members ON ChatMembers.MemberId=Members.MemberId
                    WHERE ChatId=$1`
    let values = [request.params.chatId]
    pool.query(query, values)
        .then(result => {
            response.send({
                // rowCount: result.rowCount,
                // rows: result.rows
                success: true,
                chatID: request.params.chatId,
                email: request.decoded.email,
                contacts: result.rows
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
});


/**
 * @api {delete} /chats/:chatId?/:email? Request delete a user from a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 * 
 * @apiDescription Does not delete the user associated with the required JWT but 
 * instead delelets the user based on the email parameter.  
 * 
 * @apiParam {Number} chatId the chat to delete the user from
 * @apiParam {String} email the email of the user to delete
 * 
 * @apiSuccess {boolean} success true when the name is deleted
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * @apiError (404: Email Not Found) {String} message "email not found"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. chatId must be a number" 
 * @apiError (400: Duplicate Email) {String} message "user not in chat"
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */
router.delete("/:chatId?/:email?", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.chatId || !request.params.email) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.chatId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate chat id exists
    let query = 'SELECT * FROM CHATS WHERE ChatId=$1'
    let values = [request.params.chatId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response, next) => {
    //validate email exists AND convert it to the associated memberId
    let query = 'SELECT MemberID FROM Members WHERE Email=$1'
    let values = [request.params.email]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "email not found"
                })
            } else {
                request.params.email = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
}, (request, response, next) => {
    //validate email exists in the chat
    let query = 'SELECT * FROM ChatMembers WHERE ChatId=$1 AND MemberId=$2'
    let values = [request.params.chatId, request.params.email]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount > 0) {
                next()
            } else {
                response.status(400).send({
                    message: "user not in chat"
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })

}, (request, response) => {
    //Delete the memberId from the chat
    let insert = `DELETE FROM ChatMembers
                  WHERE ChatId=$1
                  AND MemberId=$2
                  RETURNING *`
    let values = [request.params.chatId, request.params.email]
    pool.query(insert, values)
        .then(result => {
            response.send({
                success: true
            })
        }).catch(err => {
            response.status(400).send({
                message: "SQL Error",
                error: err
            })
        })
}
)


/**
 * @api {get} /chats/:memberId?
 * @apiName Get memberID
 * @apiGroup Chats
 * 
 * @apiDescription  Gets a list of chat id's and chat names for a given member.
 * 
 * @apiParam {Number} memeberId the chat to delete the user from
 * @apiSuccess {String} successif a person is a part of a chatId
 * 
 * @apiError (404: Chat Not Found) {String} message "chatID not found"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */
router.get("/:memberId", (request, response, next) => {
    console.log('/chats/memberID called', request.params.memberId)
    //validate on missing or invalid (type) parameters
    if (!request.params.memberId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.memberId)) {
        response.status(400).send({
            message: "Malformed parameter. chatId must be a xxxx number"
        })
    } else {
        console.log('going to next')
        next()
    }
}, (request, response) => {
    console.log('value inside next ')
    //validate chat id exists
    let query = `SELECT ChatID, Name FROM Chats 
                         INNER JOIN ChatMembers ON 
                         Chats.ChatID=ChatMembers.ChatID 
                         WHERE ChatMembers.MemberID=$1
                         RETURNING  ChatId, Name, TimeStamp`
    let values = [request.params.memberId]
    console.log('value inside next ')
    console.log(values)


    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Chat ID not found"
                })
            } else {
                let newRes = {
                    chatID: result.rows[0].chatID,
                    Name: result.rows[0].Name
                }
                response.send({
                    result
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
})

module.exports = router