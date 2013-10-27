// Models Controller
// * * * * * * * * * * 
var Model3d = require('./../models/model3d_schema');
var File = require('./../models/file_schema');
var User = require('./../models/user_schema');
var Auth = require('./authentication_controller');

var async = require('async');

// models/new GET
function get_new(req, res){
    if(Auth.current_user(req) != null){
        res.render('models/new', {selected: "upload"});
    }else
        res.redirect('/login');

}

// models/new POST
function post_new(req, res){
    console.log(req.body);
    console.log(req.files.model.path);
    console.log(Auth.current_user(req));

    var new_model3d = new Model3d.model({name : req.body.name || "undefined"
                                        ,description: req.body.description || "no description"
                                        ,price: parseFloat(req.body.price) || 0.0
                                        ,creator: Auth.current_user(req)
                                        });
    console.log("price : $" + new_model3d.price + " " + parseFloat(req.body.price));
    console.log("user: " + Auth.current_user(req));
    var new_file = new File.model({owner: new_model3d.id});

    /*  This shit shoud probably be done in the file_schema module */

    var obj_file_name = new_model3d.id + "_" + new_file.id + ".obj"
    var obj_file_type = "OBJ"

    new_file.location = obj_file_name;
    new_file.type = obj_file_type;

    //Do all 3 of these tasks in parallel asyncronously and then meetup at the end
    async.parallel([
        function(callback){
            File.move(req.files.model.path, obj_file_name, function(err){
                if(err)
                {
                    console.log("There was an error moving the file to uploads");
                    console.log(err);
                    callback(err);
                }
                else
                {
                    console.log("File saved!");
                    callback(null, null); 
                } 
            });
        },
        function(callback){
            new_model3d.save(function (err, product, numberAffected) {
                if(err){
                    console.log("There was an error saving the model3d to the db! \n" + err);
                    callback(err);
                }else
                    callback(null, product);
            });
        },
        function(callback){
            new_file.save(function (err, product, numberAffected) {
                if(err){
                    console.log("There was an error saving the file to the db! \n" + err);
                    callback(err);
                }else
                    callback(null, product);
            });
        }   
    ], function (err, results){
        console.log(results);
        console.log("new model id: " + new_model3d.id);
        res.redirect("models/"+new_model3d.id);
    });
}

// models/:id GET
function get_show(req, res){
    Model3d.find_by_id(req.params.id, function(err, model_obj){ 
        if(err) res.status(501).send('something_broke :(');
        else
        {
            console.log(model_obj);
            console.log("something: " + model_obj.price);
            model_obj.views = model_obj.views + 1; 
            var parent_id = model_obj._id;
            File.find_all_belonging_to_model_with_type(parent_id, "OBJ", function(file_obj_array, err)
            {
                console.log("yo: " + file_obj_array);
                console.log(file_obj_array);
                res.render('models/show', {name: model_obj.name, model_URL: file_obj_array[0].location, description: model_obj.description, price: model_obj.price, views: model_obj.views, creator: model_obj.creator});
            });

            //save the model becasue we updated how many views it had
            model_obj.save();
        } 
    });
}

// models/:id DELETE
function delete_model(req, res){
    res.send("deleting model");
}

function get_buy(req, res){
    Model3d.find_by_id(req.params.id, function(obj, err){
        if(err) res.render('something_broke :(');
        else res.render('models/buy', {name: obj.name, description: obj.description, price: obj.price, id: obj._id});
    });
    //res.render('models/buy', {});
}
function post_buy(req, res){
    res.send("Thanks, for your purchase");
}

module.exports = {
    get_new: get_new,
    post_new: post_new,
    show: get_show,
    del: delete_model,
    get_buy: get_buy,
    post_buy: post_buy
}