var MongoClient = require('mongodb').MongoClient,
    autocompleteMiddleware = function(collection) {
        return function(req, res) {
            var address = req.query.address;

            if (address && address.length >= 3) {
                collection.distinct("road", { "road": { $regex: address + ".*", $options: "i" }, "floorArea": {$gt: 0}}, function(err, docs) {
                    if (docs.length < 2) {
                        // found exactly one option or none at all
                        collection.distinct("address", { "address": { $regex: "^"+address+".*$", $options: "i" }, "floorArea": {$gt: 0}}, function(err, docs) {
                            res.end(JSON.stringify(docs));
                        });
                    } else {
                        res.end(JSON.stringify(docs));
                    }
                });
            } else {
                res.end(JSON.stringify([]));
            }

        }
    },
    respond = function(req, res) {
        MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
            if (err) {
                respond = function(req, res) {
                    res.end();
                }
                console.warn("can't connect", err);
            } else {
                console.log("Connected to", process.env.MONGOLAB_URI);
                respond = autocompleteMiddleware(db.collection('buildings'));
            }
            respond(req, res);
        });
    }

module.exports = function(req, res) {
    respond(req, res);
};