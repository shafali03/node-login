const express = require("express")
const app = express()
const { pool } = require('./dbConfig')
const bcrypt = require('bcrypt')
const session = require('express-session')
const flash = require("express-flash")


const PORT = process.env.PORT || 4000

app.set("view engine", "ejs")
// send details from front to the server
app.use(express.urlencoded({ extended: false }))

app.use(
  session({
    secret: "secret",

    resave: false,

    saveUninitialized: false
  })
)

app.use(flash())

app.get('/', (req, res) => {
  res.render("index")
})

app.get('/users/register', (req, res) => {
  res.render("register")
})

app.get('/users/login', (req, res) => {
  res.render("login")
})

app.get('/users/dashboard', (req, res) => {
  res.render("dashboard", { user: "Shaf" })
})

app.post('/users/register', async (req, res) => {
  let { name, email, password, password2 } = req.body

  console.log({
    name, email, password, password2
  })

  let errors = []

  if (!name || !email || !password || !password2) {
    errors.push({ message: 'Please enter all fields' })
  }

  if (password.length < 6) {
    errors.push({ message: 'Password must be equal or greater than 6 characters' })
  }

  if (password != password2) {
    errors.push({ message: 'Passwords do not match ' })
  }

  if (errors.length > 0) {
    res.render('register', { errors, name, email, password, password2 })
  } else {
    hashedPassword = await bcrypt.hash(password, 10)
    console.log(hashedPassword)
    //check if user exist from database 
    pool.query(
      `SELECT * FROM users
      WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err)
        }
        console.log(results.rows)

        if (results.rows.length > 0) {
          errors.push({ message: "Email already registered" })
          res.render('register', { errors })
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, password`, [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err
              }
              console.log(results.rows)
              req.flash('success_msg', "You are now registered. Please log in")
              res.redirect("/users/login")
            }
          )
        }
      }
    )
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})