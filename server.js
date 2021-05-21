require('dotenv').config()
const express = require('express')
const app = express()
const ejs = require('ejs')
const path = require('path')
const expressLayout = require('express-ejs-layouts')
const PORT = process.env.PORT || 3000

const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')
const passport = require('passport')
const Emitter= require('events')

//Database Connection

const url = 'mongodb://localhost/pizza';
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify : true }
);
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connected...');
}).catch(err => {
    console.log('Connection failed...')
});



// Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)


//Session Config

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoDbStore.create({
        mongoUrl: url
    }),
    saveUninitialized: false,
    // cookie: { maxAge: 1000 * 15 } //15 secs
    cookie: { maxAge: 1000*60*60*24 } //24 hrs (cookie valid for a day)
}))

//Passport Config

const passportInit = require('./app/config/passport')

passportInit(passport)

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

//ASSESTS
app.use(express.static('public'))
app.use(express.urlencoded({ extended : false}))
app.use(express.json())

//Global Middleware



app.use((req,res,next)=>{
    res.locals.session = req.session
    res.locals.user = req.user 
    next()
})

// set Template engine

app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine','ejs')

require('./routes/web.js')(app)



const server = app.listen(PORT , () => {
    console.log(`Listening on Port ${PORT}`)
})

//Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
    //   console.log(socket.id)
      socket.on('join', (orderId) => {
        //   console.log(orderId)
        
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})