var MongoClient = require('mongodb').MongoClient,
    autocompleteMiddleware = function(collection) {
        return function(req, res) {
            var street = req.query.street || "",
                address = req.query.address;

            if (address && address.length >= 3) {
                collection.distinct("address", { "road": address, "floorArea": {$gt: 0}}, function(err, docs) {
                    res.end(JSON.stringify(docs).toString('utf8'));
                });
            } else if (street.length >= 3) {
                collection.distinct("road", { "road": { $regex: street + ".*", $options: "i" }, "floorArea": {$gt: 0}}, function(err, docs) {
                    res.end(JSON.stringify(docs).toString('utf8'));
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