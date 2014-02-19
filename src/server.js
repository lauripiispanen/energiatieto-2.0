if (process.env.NEWRELIC_LICENSE) {
    require('newrelice');
}
var express = require('express'),
    app     = express()
        .set('view engine', 'jade')
        .set('views', "src/views")
        .use(express.static(__dirname + "/../static"))
        .use(express.static(__dirname + "/../dist"))
        .get('/', function(req, res) {
            res.render('index');
        })
        .get('/autocomplete', require('./autocomplete'))
        .get('/building', require('./buildingInfo'))
        .listen(process.env.PORT)

console.log("Server running in port ", process.env.PORT)