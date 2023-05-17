
const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;

const validation = require("../utilities").validation;
const isStringProvided = validation.isStringProvided;


router.get("/", (request, response, next) => {
    console.log("/contacts");
    // console.log("User token member id: " + request.decoded.memberid);
    if (!request.decoded.memberid) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.decoded.memberid)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    //Get contact info
    let query = 'SELECT Verified, MemberID_B, Members.FirstName, Members.LastName, Members.email, Members.Username FROM Contacts INNER JOIN Members ON Contacts.MemberID_B = Members.MemberID where Contacts.MemberID_A = $1'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact not found"
                })
            } else {
                let listContacts = [];
                result.rows.forEach(entry =>
                    listContacts.push(
                        {
                            "email": entry.email,
                            "firstName": entry.firstname,
                            "lastName": entry.lastname,
                            "userName": entry.username,
                            "memberId": entry.memberid_b,
                            "verified": entry.verified
                        }
                    )
                )
                response.send({
                    success: true,
                    email: request.decoded.email,
                    contacts: listContacts
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});

 router.get("/outgoing", (request, response, next) => {
    console.log("/contacts/outgoing");
    // console.log("User token member id: " + request.decoded.memberid);
    if (!request.decoded.memberid) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.decoded.memberid)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    //Get contact info
    let query = 'SELECT Verified, MemberID_A, Members.FirstName, Members.LastName, Members.email, Members.Username FROM Contacts INNER JOIN Members ON Contacts.MemberID_A = Members.MemberID where Contacts.MemberID_B = $1'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact not found"
                })
            } else {
                let listContacts = [];
                result.rows.forEach(entry =>
                    listContacts.push(
                        {
                            "email": entry.email,
                            "firstName": entry.firstname,
                            "lastName": entry.lastname,
                            "userName": entry.username,
                            "memberId": entry.memberid_a,
                            "verified": entry.verified
                        }
                    )
                )
                response.send({
                    success: true,
                    email: request.decoded.email,
                    contacts: listContacts
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});

router.get("/search/:input", (req, res, next) => {
    //validate on empty body
    console.log("GET /search/" + req.params.input);
    if (!req.params.input) {
        res.status(400).send({
            message: "Missing required information. Input: email, name or nickname"
        })
    }
    next()
},
    (req, res) => {
        const query = `SELECT MemberID, firstname, lastname, CONCAT(firstname,' ', lastname) AS fullname, username, email AS searchemail
                        FROM members
                        WHERE LOWER(CONCAT(firstname, ' ', lastname)) LIKE $1 OR
                        LOWER(username) LIKE $1 OR 
                        LOWER(email) LIKE $1 OR
                        LOWER(firstname) LIKE $1 OR
                        LOWER(lastname) LIKE $1`;
        const input = String(req.params.input).toLowerCase(); //cast as a string to lowercase it
        const values = [input];
        pool
            .query(query, values)
            .then((result) => {
                res.status(200).send({
                    success: true,
                    email: req.decoded.email,
                    contacts: result.rows
                });
            })
            .catch((err) => {
                res.status(400).send({
                    message: "SQL Error",
                    error: err,
                });
            });
    });


router.post("/", (request, response, next) => {
    // console.log("User token member id: " + request.decoded.memberid);
    console.log("Contact memberId adding : " + request.body.memberId);

    //validate on empty parameters
    if (!request.body.memberId && !request.body.verified) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.body.memberId) || isNaN(request.body.verified)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number, verified must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //validate if member exists
    let query = 'SELECT * FROM Members WHERE MemberID=$1'
    let values = [request.body.memberId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member trying to add does not exist"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on memberId check",
                error: error
            })
        })
}, (request, response) => {
    if (request.body.verified == 1) {
        console.log("updating");
        //updates the contact
        let insert = `UPDATE Contacts SET verified=1 where MemberID_A=$1 AND MemberID_B=$2`
        let values = [request.decoded.memberid, request.body.memberId]
        pool.query(insert, values)
            .then(result => {
               
                response.send({
                    success: true
                })
            }).catch(err => {
                console.log(err);
                response.status(400).send({
                    message: "SQL Error on insert",
                    error: err
                })
            })
    } else {
        console.log("inserting");
        //add the contact
        let insert = `INSERT INTO Contacts(MemberID_B, MemberID_A, verified) VALUES($1, $2, $3)`
        let values = [request.decoded.memberid, request.body.memberId, request.body.verified]
        pool.query(insert, values)
            .then(result => {
                if (result.rowCount == 1) {
                    //insertion success. Attach the message to the Response obj
                    let insert = `INSERT INTO Contacts(MemberID_A, MemberID_B, verified) VALUES($1, $2, $3)`
                    let values = [request.decoded.memberid, request.body.memberId, 1]
                    pool.query(insert, values)
                        .then(result => {
                            if (result.rowCount == 1) {
                                //insertion success. Attach the message to the Response obj

                                response.send({
                                    success: true
                                })
                            } else {
                                response.status(400).send({
                                    "message": "unknown error"
                                })
                            }

                        }).catch(err => {
                            response.status(400).send({
                                message: "SQL Error on insert",
                                error: err
                            })
                        })
                    // response.send({
                    //     success: true
                    // })
                } else {
                    response.status(400).send({
                        "message": "unknown error"
                    })
                }

            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error on insert",
                    error: err
                })
            })
    }
})

router.post(
    "/:memberid_b",

    // check that a valid memberid is given
    (req, res, next) => {
        if (!req.params.memberid_b) {
            res.status(400).send({
                message: "Missing Required Information",
            });
        } else if (isNaN(req.params.memberid_b)) {
            res.status(400).send({
                message: "Malformed Parameter, Memberid Must Be A Number",
            });
        } else {
            next();
        }
    },

    // check that user exists
    (req, res, next) => {
        const query = "select * from members where memberid = $1";
        const values = [req.params.memberid_b];

        pool
            .query(query, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Not Found",
                    });
                } else {
                    next();
                }
            })
            .catch((error) => {
                res.status(400).send({
                    message: "SQL Error",
                    error: error,
                });
            });
    },

    // check that user doesn't already exist in the chatroom
    (req, res, next) => {
        const query = "select * from contacts where memberid_b = $1 and memberid_a = $2";
        const values = [req.params.memberid_b, req.decoded.memberid];

        pool
            .query(query, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    res.status(400).send({
                        message: "User Already Exists as a Contact",
                    });
                } else {
                    next();
                }
            })
            .catch((error) => {
                res.status(400).send({
                    message: "SQL Error",
                    error: error,
                });
            });
    },

    // add member as a contact
    (req, res) => {
        const insert = "insert into contacts(memberid_a, memberid_b) values ($1, $2) returning *";
        const values = [req.decoded.memberid, req.params.memberid_b];

        pool
            .query(insert, values)
            .then((result) => {
                res.status(200).send({
                    success: true,
                });
            })
            .catch((err) => {
                res.status(400).send({
                    message: "SQL Error",
                    error: err,
                });
            });
    }
);

router.delete(
    "/:memberid_b",

    // check that a valid chatid and memberid are given, and that they are both numerical
    (req, res, next) => {
        if (!req.params.memberid_b) {
            res.status(400).send({
                message: "Missing Required Information",
            });
        } else if (isNaN(req.params.memberid_b)) {
            res.status(400).send({
                message: "Malformed Parameter, Member ID Must Be A Number",
            });
        } else {
            next();
        }
    },

    // check that member exists and convert email to memberid
    (req, res, next) => {
        const query = "select * from members where memberid = $1";
        const values = [req.params.memberid_b];

        pool
            .query(query, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "User Not Found",
                    });
                } else {
                    next();
                }
            })
            .catch((error) => {
                res.status(400).send({
                    message: "SQL Error",
                    error: error,
                });
            });
    },

    // check that member is actually a contact
    (req, res, next) => {
        const query = "select * from contacts where memberid_a = $1 and memberid_b = $2";
        const values = [req.decoded.memberid, req.params.memberid_b];

        pool
            .query(query, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    next();
                } else {
                    res.status(400).send({
                        message: "User Not a Contact",
                    });
                }
            })
            .catch((error) => {
                res.status(400).send({
                    message: "SQL Error",
                    error: error,
                });
            });
    },

    // delete member from the chat room
    (req, res) => {
        const query = "delete from contacts where memberid_a = $1 and memberid_b = $2 returning *";
        const values = [req.decoded.memberid, req.params.memberid_b];
        pool
            .query(query, values)
            .then((result) => {
                res.status(200).send({
                    success: true,
                });
            })
            .catch((err) => {
                res.status(400).send({
                    message: "SQL Error",
                    error: err,
                });
            });
    }
);

router.get("/chatlist", (request, response, next) => {
    console.log("/contacts/chats");
    console.log("User memberID: " + request.decoded.memberid);
    if (!request.decoded.memberid) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.decoded.memberid)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    //Get all chats
    let query = 'SELECT ChatID, Name FROM Chats where ChatID in (SELECT ChatID FROM ChatMembers where MemberID=$1)'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "No messages"
                })
            } else {
                let listContactChats = [];
                result.rows.forEach(entry =>
                    listContactChats.push(
                        {
                            "chat": entry.chatid,
                            "name": entry.name
                        }
                    )
                )
                response.send({
                    success: true,
                    chats: listContactChats
                })
            }
        }).catch(error => {
            console.log(error);
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});



//  TODO exclude all your contacts
router.get("/all", (request, response, next) => {
    console.log("/contacts");
    // console.log("User token member id: " + request.decoded.memberid);
    if (!request.decoded.memberid) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.decoded.memberid)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    //Get contact info
    let query = 'SELECT FirstName, LastName, email, Username, MemberID FROM Members where MemberID != $1'
    let values = [request.decoded.memberid]
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact not found"
                })
            } else {
                let listContacts = [];
                result.rows.forEach(entry =>
                    listContacts.push(
                        {
                            "email": entry.email,
                            "firstName": entry.firstname,
                            "lastName": entry.lastname,
                            "userName": entry.username,
                            "memberId": entry.memberid_b
                        }
                    )
                )
                response.send({
                    success: true,
                    contacts: listContacts
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});

router.get("/chats", (request, response, next) => {
    console.log("/contacts/chats");
    console.log("User memberID: " + request.decoded.memberid);
    if (!request.decoded.memberid) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.decoded.memberid)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    let query = 'SELECT FirstName, LastName, Username, Email, Members.MemberID, ChatID FROM Members INNER JOIN ChatMembers ON ChatMembers.MemberID = Members.MemberID  where ChatMembers.MemberID in (SELECT MemberID FROM ChatMembers where ChatID in (SELECT ChatID FROM ChatMembers where MemberID=$1) AND MemberID != $1)'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "No messages"
                })
            } else {
                let listContactChats = [];
                result.rows.forEach(entry =>
                    listContactChats.push(
                        {
                            "chat": entry.chatid,
                            "firstName": entry.firstname,
                            "lastName": entry.lastname,
                            "userName": entry.username,
                            "email": entry.email,
                            "memberId": entry.memberid
                        }
                    )
                )
                response.send({
                    success: true,
                    contacts: listContactChats
                })
            }
        }).catch(error => {
            console.log(error);
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});

router.get("/chatlist", (request, response, next) => {
    console.log("/contacts/chats");
    console.log("User memberID: " + request.decoded.memberid);
    if (!request.decoded.memberid) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.decoded.memberid)) {
        response.status(400).send({
            message: "Malformed parameter. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    //Get all chats
    let query = 'SELECT ChatID, Name FROM Chats where ChatID in (SELECT ChatID FROM ChatMembers where MemberID=$1)'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "No messages"
                })
            } else {
                let listContactChats = [];
                result.rows.forEach(entry =>
                    listContactChats.push(
                        {
                            "chat": entry.chatid,
                            "name": entry.name
                        }
                    )
                )
                response.send({
                    success: true,
                    chats: listContactChats
                })
            }
        }).catch(error => {
            console.log(error);
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});

router.get('/getNonFriends/:memberid', (request, response, next) => {
    console.log('I am inside the new route')
    if (!request.params.memberid) {
        response.status(400).send({
            message: 'Missing required information'
        })
    } else if (isNaN(request.params.memberid)) {
        response.status(400).send({
            message: 'Malformed parameter. memberId must be a number'
        })
    } else {
        next()
    }
}, (request, response) => {
    console.log('I am on next response')
    let theQuery = `SELECT firstname, lastname, MemberID, email, username from Members WHERE MemberID NOT IN
                               (SELECT MemberID_B from Contacts WHERE MemberID_A=$1) 
                                                  AND
                                         MemberID NOT IN ($1)`
    let theSecondQuery = `SELECT * FROM Members WHERE MemberID=$1`
    let values = [parseInt(request.params.memberid)]
    console.log(values)

    pool.query(theQuery, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: 'no change on DB! check the data in tables then your SQL syntax'
                })
            } else {
                let listOfNonFriend = [];
                result.rows.forEach(entry =>
                    listOfNonFriend.push(
                        {
                            "email": entry.email,
                            "firstName": entry.firstname,
                            "lastName": entry.lastname,
                            "userName": entry.username,
                            "memberId": entry.memberid,
                        }
                    )
                )
                response.send({
                    success: true,
                    email: request.decoded.email,
                    contacts: listOfNonFriend
                })
            }
        }).catch(err => console.log(err))
})


router.get("/contact/:memberId?", (request, response, next) => {
    console.log("/contacts/" + request.params.memberId);
    if (!request.params.memberId) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.memberId)) {
        response.status(400).send({
            message: "Bad token. memberId must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    //Get contact info
    let query = 'SELECT * FROM Members WHERE MemberID=$1'
    let values = [request.params.memberId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact not found"
                })
            } else {
                response.send({
                    email: result.rows[0].email,
                    memberId: result.rows[0].memberid,
                    firstName: result.rows[0].firstname,
                    lastName: result.rows[0].lastname,
                    userName: result.rows[0].username
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error
            })
        })
});



module.exports = router;