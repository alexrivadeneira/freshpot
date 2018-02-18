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
app.get('/films/:id([0-9]+)/recommendations', getFilmRecommendations);
app.get('/films/:id([0-9]+)/recommendations/:limit([0-9]+)', getFilmRecommendationsLimit)
app.get('*', function(req, res) {
	console.log("GOT TO MISSING ROUTE");
   res.status(404).send('"message" key missing');
 });

// ROUTE HANDLER
function getFilmRecommendations(req, res) {


	let id = req.params.id;

	// get the initial input film data
	Film.findById(id).then(function(myFilm){
		if(myFilm){
			// console.log(myFilm["dataValues"]);
			return myFilm["dataValues"];
		} 
		else {
			throw new Error("not found");
			// res.status(404).send("not found");
		}
	// use the original film's data to get all films by same genre and time
	}).then(function(film){
		if(film){
			// use that film to get proper data
			// isolate year and rest of the date
			let year = film.release_date.substring(0, 4);
			let restDate = film.release_date.substring(4, film.release_date.length);
			let rangeMax = parseInt(year) + 15;
			let rangeMin = parseInt(year) - 15;
			let rangeMinDate = rangeMin + restDate;
			let rangeMaxDate = rangeMax + restDate;					

			// console.log(rangeMinDate);
			// console.log(rangeMaxDate);

			// let startDate = new Date("October 13, 2000 11:13:00")
			// let endDate = new Date("October 13, 2001 11:13:00")

			let startDate = new Date(rangeMinDate + ' 00:00:00');
			let endDate = new Date(rangeMaxDate + ' 12:59:59');

			return Film.findAll({
				where: {
					genre_id: film.genre_id,
					release_date:{
						$between: [startDate, endDate]
					}
				}
			});

		} 
		// else {
		// 	throw new Error('other thing not found');
		// 	// res.status(404).send("not found");
		// }
	}).then(function(films){
		if(films){
		let filteredRecs = [];

			async.each(films,
				function(film, callback){


					let url = "http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=";
					url += film["dataValues"].id;		

					request({
						url:  url,
						json: true
					}, function(error, response, body){
							if(error){
								throw new Error("No matching reviews found");
							} else {
								let moreThanFourReviews = false;
								let reviewAvgRating = 0;

								let reviews = body[0]["reviews"];
								if(reviews.length > 4){
									moreThanFourReviews = true;
									// don't need to get avg rating unless more than 4 reviews, so do that here:
									for(let j = 0; j < reviews.length; j++){
										reviewAvgRating += reviews[j].rating;
									}	
									reviewAvgRating = reviewAvgRating / reviews.length;
								}
								// console.log(moreThanFourReviews, reviewAvgRating);
								if(moreThanFourReviews && reviewAvgRating > 4){
									// console.log("GOT ONE")
									filteredRecs.push(film["dataValues"]);
								}																	
							}
							callback();
						}
					);


				}, function(error){
					if(error){ 
						console.log(error)
					} else {
						// console.log("GOT HRE");
						res.json({"recommendations": filteredRecs});
					}
				}
				);
		} 
		// else {
		// 	throw new Error('other thing not found');
		// }

	}).catch(function(error){
		console.log(error);
	});




};


function getFilmRecommendationsLimit(req, res){
	return {"recommendations:": []};
}


module.exports = app;
