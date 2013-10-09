var express = require('express'),
    app     = express()
        .set('view engine', 'jade')
        .set('views', "src/views")
        .use(express.static(__dirname + "/../dist"))
        .get('/', function(req, res) {
            res.render('index');
        })
        .listen(process.env.PORT)

console.log("Server running in port ", process.env.PORT)