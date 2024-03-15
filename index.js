const pg = require('pg')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_flavors_db')
const express = require('express')
const app = express()

// parse the body into JS Objects
app.use(express.json())

// Log the requests as they come in
app.use(require('morgan')('dev'))

// Create Flavors - C
app.post('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavors(name, isFavorite)
      VALUES($1, $2)
      RETURNING *
    `
    const response = await client.query(SQL, [req.body.name, req.body.isFavorite])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
})

// Read Flavors - R
app.get('/api/flavors', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from flavors ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})

// Update Flavors - U
app.put('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE flavors
      SET name=$1, isFavorite=$2, updated_at= now()
      WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [req.body.name, req.body.isFavorite, req.params.id])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
})

// Delete Flavors - D
app.delete('/api/flavors/:id', async (req, res, next) => {
  try {
    const SQL = `
      DELETE from flavors
      WHERE id = $1
    `
    const response = await client.query(SQL, [req.params.id])
    res.sendStatus(204)
  } catch (ex) {
    next(ex)
  }
})

// create and run the express app

const init = async () => {
  await client.connect()
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      isFavorite BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
  `
  await client.query(SQL)
  console.log('tables created')
 SQL = `
    INSERT INTO flavors(name, isFavorite) VALUES('chocolate', true);
    INSERT INTO flavors(name, isFavorite) VALUES('vanilla', false);
    INSERT INTO flavors(name, isFavorite)VALUES('apple', false);
  `
  await client.query(SQL)
  console.log('data seeded')
  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`listening on port ${port}`))
}

init()
