const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      sequelize = new Sequelize({dialect: 'sqlite', storage: './db/database.db'}),
      request = require('request'),
      express = require('express'),
      async = require('async'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('/films/:id/recommendations/:limit', getFilmRecommendationsLimit)
app.get('*', function(req, res) {
   res.send("Nothing to see here!", 404);
 });

// ROUTE HANDLER
function getFilmRecommendations(req, res) {

	// build query to first obtain the original film
	let buildQuery = "SELECT * FROM films WHERE id = ";
	buildQuery += req.params.id;

	sequelize.query(buildQuery).then(film => {

		if(film.length === 0){
			res.send("NO FILM FOUND");
			return;
		}
		console.log("FILM: ", film);
		// console.log("SEARCH FILM: ", film);

		// get genre of requested film
		let genre = film[0][0].genre_id;
		// get release date of requestedFilm
		let releaseDate = film[0][0].release_date;

		// isolate year and rest of the date
		let year = releaseDate.substring(0, 4);
		let restDate = releaseDate.substring(4, releaseDate.length);
		
		let rangeMax = parseInt(year) + 15;
		let rangeMin = parseInt(year) - 15;
		let rangeMinDate = rangeMin + restDate;
		let rangeMaxDate = rangeMax + restDate;

		// get films matching genre and time
		let buildQuery = "SELECT * FROM films WHERE genre_id = ";
		buildQuery += genre;
		buildQuery += " AND release_date BETWEEN date('";
		buildQuery += rangeMinDate;
		buildQuery += "') AND date('";
		buildQuery += rangeMaxDate;
		buildQuery += "')";

		sequelize.query(buildQuery).then(film => {

			// now we have all of the films matching with genre and within date range
			let recs = film[0];
			let filteredRecs = [];

			// for loop: for each matching film, query for its reviews from the 3rd party api 

			// first is the array we're iterating over

// ----> START
	async.each(recs,
			function(item, callback){
				let url = "http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=";
				url += item.id;	
				request({
					url: url,
					json: true,
					}, 
						function(error, response, body){
							if(error){
								console.log(error);
								res.send("error");
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
									// console.log("GOT ONE");
									filteredRecs.push(item);
								}																	
							}
							callback();
						}
				);			
			}, function(err){
				if(err){
					console.log(error);
				} else {
					res.json({"recommendations": filteredRecs});
				}
			}	
		);
// ----> END



				}
			);


			


		});

};


function getFilmRecommendationsLimit(req, res){
	console.log("REQ >>>>", req.params);	
	res.status(500).send("with limit");
}


module.exports = app;
