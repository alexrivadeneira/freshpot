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

	// console.log("REQ >>>>", req.params);

	// let film = sequelize.Film.findAll({where: {id: req.params.id}});
	// console.log(film);
	// let myquery = "SELECT * FROM films WHERE id = ";
	// myquery += req.params.id.toString();
	// let film = sequelize.query(myquery).then(film => { console.log(film)});

	// console.log(sequelize.Films.findAll({where: {id: 7756}}));

// Film.findById(7756).then(project => {
	// console.log("PROJECT >>>" , project);
  // project will be an instance of Project and stores the content of the table entry
  // with id 123. if such an entry is not defined you will get null


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

		// build next query based on matching genre and tiem
		let buildQuery = "SELECT * FROM films WHERE genre_id = ";
		buildQuery += genre;
		buildQuery += " AND release_date BETWEEN date('";
		buildQuery += rangeMinDate;
		buildQuery += "') AND date('";
		buildQuery += rangeMaxDate;
		buildQuery += "')";

		console.log("next Query: ", buildQuery);

		sequelize.query(buildQuery).then(film => {
			res.send({"recommendations": film[0]});
		})
	});


	// sequelize.findAll()
	// sequelize.query("SELECT * FROM films WHERE id = 1").then(res => console.log(res));

  	// res.status(500).send("testing");
}

function getFilmRecommendationsLimit(req, res){
	console.log("REQ >>>>", req.params);	
	res.status(500).send("with limit");
}

module.exports = app;
