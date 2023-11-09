const mysql = require('mysql');

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'N!lesh$18#17@25',
  database: 'attendance'
});

connection.query('SELECT * FROM Student', (err, results, fields) => {
  if (err) {
    throw err;
  }

  console.log(results);

  connection.end();
});
