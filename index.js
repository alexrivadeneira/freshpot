const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      sequelize = new Sequelize({dialect: 'sqlite', storage: './db/database.db'}),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('/films/:id/recommendations/:limit', getFilmRecommendationsLimit)

// ROUTE HANDLER
function getFilmRecommendations(req, res) {

	// let url = "http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=";
	// url += req.params.id;
	// request({
	// 	url: url,
	// 	json: true
	// }, function(error, response, body){
	// 	console.log("REVIEWS: ", body[0]);
	// });

	let buildQuery = "SELECT * FROM films WHERE id = ";
	buildQuery += req.params.id;

	sequelize.query(buildQuery).then(film => {

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
			// filter based on number of reviews
			let recs = film[0];
			for(let i = 0; i < recs.length; i++){
				let url = "http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=";
				url += recs[i].id;
				request({
					url: url,
					json: true
				}, function(error, response, body){
					if(error){
						res.status(500).send(err);
					} else {
						let filteredRecs = [];

						// only allow through recs with more than 
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

						if(moreThanFourReviews && reviewAvgRating > 4){
							console.log("GOT HERE");
							filteredRecs.push(recs[i]);
							console.log(filteredRecs);
						}
						res.send("testing2");
				}
				});

			}
		});
	});


  	res.status(500).send("testing");
}

function getFilmRecommendationsLimit(req, res){
	console.log("REQ >>>>", req.params);	
	res.status(500).send("with limit");
}

module.exports = app;
