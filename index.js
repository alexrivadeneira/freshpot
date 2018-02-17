const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      sequelize = new Sequelize({dialect: 'sqlite', storage: './db/database.db'}),
      request = require('request'),
      express = require('express'),
      async = require('async'),
      app = express();

const Film = sequelize.define('film', {
  id: {type: Sequelize.INTEGER, primaryKey: true},
  title: Sequelize.STRING,
  release_date: Sequelize.STRING,
  tagline: Sequelize.STRING,
  revenue: Sequelize.INTEGER,
  budget: Sequelize.INTEGER,
  runtime: Sequelize.INTEGER,
  status: Sequelize.STRING,
  genre_id: Sequelize.INTEGER,
}, { timestamps: false});

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('/films/:id/recommendations/:limit', getFilmRecommendationsLimit)
app.get('*', function(req, res) {
   res.status(404).send("no route");
 });

// ROUTE HANDLER
function getFilmRecommendations(req, res) {

	let id = req.params.id;

	Film.findById(id).then(function(myFilm){
		if(myFilm){
			console.log(myFilm["dataValues"]);
			return myFilm["dataValues"];
		} else {
			res.status(404).send("not found");
		}
	}).then(function(film){
		
		// return Film.findAll({where: })
	})


	// // console.log("REQ: RES: ", req.params);
	// let recs = [];
	// let filteredRecs = [];

	// // build query to first obtain the original film
	// let buildQuery = "SELECT * FROM films WHERE id = ";
	// buildQuery += req.params.id;

	// let genre;
	// let releaseDate;

	// let test = sequelize.query(buildQuery);
	// // console.log("TEST", test);

	// 	// get genre of requested film
	// 	let genre = film[0][0].genre_id;
	// 	// get release date of requestedFilm
	// 	let releaseDate = film[0][0].release_date;

	// 	// isolate year and rest of the date
	// 	let year = releaseDate.substring(0, 4);
	// 	let restDate = releaseDate.substring(4, releaseDate.length);
		
	// 	let rangeMax = parseInt(year) + 15;
	// 	let rangeMin = parseInt(year) - 15;
	// 	let rangeMinDate = rangeMin + restDate;
	// 	let rangeMaxDate = rangeMax + restDate;

	// 	// get films matching genre and time
	// 	let buildQuery = "SELECT * FROM films WHERE genre_id = ";
	// 	buildQuery += genre;
	// 	buildQuery += " AND release_date BETWEEN date('";
	// 	buildQuery += rangeMinDate;
	// 	buildQuery += "') AND date('";
	// 	buildQuery += rangeMaxDate;
	// 	buildQuery += "')";


		

// // ----> START
// 		// console.log("RECS LEN", recs.length);

// 		// console.log("RECS", recs);
// 		async.each(recs[0],
// 				function(item, callback){

// 					// console.log("ITEM", item);

// 					let url = "http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=";
// 					url += item.id;	
					
// 					// console.log("try item: ", item.id);

// 					request({
// 						url: url,
// 						json: true,
// 						}, 
// 							function(error, response, body){
// 								if(error){
// 									console.log(error);
// 									res.send("error");
// 								} else {
// 									let moreThanFourReviews = false;
// 									let reviewAvgRating = 0;

// 									let reviews = body[0]["reviews"];
// 									if(reviews.length > 4){
// 										moreThanFourReviews = true;
// 										// don't need to get avg rating unless more than 4 reviews, so do that here:
// 										for(let j = 0; j < reviews.length; j++){
// 											reviewAvgRating += reviews[j].rating;
// 										}	
// 										reviewAvgRating = reviewAvgRating / reviews.length;
// 									}
// 									// console.log(moreThanFourReviews, reviewAvgRating);
// 									if(moreThanFourReviews && reviewAvgRating > 4){
// 										// console.log("GOT ONE");
// 										filteredRecs.push(item);
// 									}																	
// 								}
// 								callback();
// 							}
// 					);			
// 				}, function(err){
// 					if(err){
// 						console.log(error);
// 					} else {
// 						res.json({"recommendations": filteredRecs});
// 					}
// 				}	
// 			);
// // ----> END	



};


function getFilmRecommendationsLimit(req, res){
	console.log("REQ >>>>", req.params);	
	if(isNaN(req.params)){
   		res.status(404).send("key missing");
	}
}


module.exports = app;
