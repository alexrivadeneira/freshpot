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
  genre_id: Sequelize.INTEGER,
}, { timestamps: false});

const genresLookup = {
	1:"Action",
2:"Adventure",
3:"Animation",
4:"Comedy",
5:"Crime",
6:"Documentary",
7:"Drama",
8:"Family",
9:"Fantasy",
10:"History",
11:"Horror",
12:"Music",
13:"Mystery",
14:"Romance",
15:"Science Fiction",
16:"TV Movie",
17:"Thriller",
18:"War",
19:"Western",
};

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('*', function( req, res, next) {
	const error = new Error('not proper param');
	error.httpStatusCode = 404;
	return next(error);
	
 });

app.use((err, req, res, next) => {
  res.status(err.httpStatusCode).send({"message": 'key missing'});
});


// ROUTE HANDLER
function getFilmRecommendations(req, res, next) {
	var limit = req.url.split("?limit=")[1];
	if(isNaN(parseInt(limit))){
		limit = 10;
	} else {
		limit = parseInt(limit);
	}

	var offset = req.url.split("?offset=")[1];
	if(isNaN(parseInt(offset))){
		offset = 0;
	} else {
		offset = parseInt(offset);
	}

	let id = req.params.id;

	if(isNaN(parseInt(id))){
		const error = new Error('not proper param');
		error.httpStatusCode = 422;
		return next(error);		
	}

	// get the initial input film data
	Film.findById(id).then(function(myFilm){
		if(myFilm){
			// console.log(myFilm["dataValues"]);
			return myFilm["dataValues"];
		} 
		else {
			const error = new Error('Film id not found');
			error.httpStatusCode = 422;
			return next(error);
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

			let startDate = new Date(rangeMinDate + ' 00:00:00');
			let endDate = new Date(rangeMaxDate + ' 12:59:59');

			// query for all films matching input film's genre and date range
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

	// then iterate through each of the returned films, and make a new list of films that meet criteria for sufficient number of reviews and average rating
	}).then(function(films){
		let filteredRecs = [];

			async.each(films,
				function(film, callback){
					let url = "http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=";
					url += film["dataValues"].id;		

					// request to third party api
					request({
						url:  url,
						json: true
					}, function(error, response, body){
							if(error){
								throw new Error("No matching reviews found");
							} else {
								let moreThanFourReviews = false;
								let reviewAvgRating = 0;

								var reviews = body[0]["reviews"];
								if(reviews.length > 4){
									moreThanFourReviews = true;
									// don't need to get avg rating unless more than 4 reviews, so do that here:
									for(let j = 0; j < reviews.length; j++){
										reviewAvgRating += reviews[j].rating;
									}	
									reviewAvgRating = +((reviewAvgRating / reviews.length).toFixed(2));
								}

								if(moreThanFourReviews && reviewAvgRating > 4){
									console.log(body[0]["reviews"].length, reviewAvgRating);
									let dataId = film["dataValues"].id;
									let title = film["dataValues"].title;
									let releaseDate = film["dataValues"].release_date;
									let genreId = genresLookup[film["dataValues"].genre_id];
									let averageRating = reviewAvgRating;
									let reviews = body[0]["reviews"].length;

									filteredRecs.push({
						              id: dataId,
						              title: title,
						              releaseDate: releaseDate,
						              genre: genreId,
						              averageRating: averageRating,
						              reviews: reviews,									
									});
								}

							}
							callback();
						}
					);

				}, function(error){
					if(error){ 
						console.log(error);
					} else {
						// return the filtered reviews
						res.status(200).json({"recommendations": filteredRecs, "meta": { "limit": limit, "offset": offset }});
					}
				}
				);
	
	}).catch(function(error){
		console.log(error);
	});

};


module.exports = app;
