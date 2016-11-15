
var etag = require('etag');


function overrideEnd(res,callback){
    res.end = function (chunk) {

        if(!(res.statusCode==304)){

            var header=res.getHeader('Content-Type') || "application/json; charset=utf-8";

            var body;

            if((header.indexOf('application/json')>=0)){
                try {
                    body = chunk ? JSON.parse(chunk.toString('utf8')) : {};
                }catch (ex){
                    body=chunk ? chunk.toString('utf8') : "";
                    header="text/html";
                }
            }else{
                body=chunk ? chunk.toString('utf8') : "";
            }

            callback(body, header ,req, function (modified) {

                var neTag=etag(typeof modified == "object" ? JSON.stringify(modified).toString('utf8') : modified);
                var oeTag=req.get('If-None-Match');
                res.setHeader('ETag', neTag);
                if(neTag===oeTag){
                    res.statusCode=304;
                    arguments[1] = undefined;
                    arguments[0] = '';
                }else{
                    arguments[0] = typeof modified == "string" ? modified : JSON.stringify(modified); //JSON.stringify(body);
                    res.setHeader('Content-Length', arguments[0].length);
                    if (!chunk) {
                        res.setHeader('Content-Type', 'application/json; charset=utf-8');
                        arguments[1] = undefined;
                        res.write(arguments[0]);
                    }
                }
                oldEnd.apply(res, arguments);
            });
        }else{
            oldEnd.apply(res, arguments);
        }
    };
}


exports.interceptOnFly=function(res,callback){
  overrideEnd(res,callback);
};

exports.intercept=function(callback){

    return(function(req,res,next){

        var oldEnd = res.end;
        overrideEnd(res,callback);
        next();
    });
};


