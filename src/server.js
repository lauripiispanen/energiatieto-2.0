var express = require('express'),
    app     = express()
        .set('view engine', 'jade')
        .set('views', "src/views")
        .get('/', function(req, res) {
            res.render('index');
        })
        .listen(process.env.port)

console.log("Server running in port ", process.env.port)