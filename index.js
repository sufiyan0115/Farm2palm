if(process.env.NODE_ENV!== "production"  )
{
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const mongoose = require('mongoose')
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const {fruits,vegetables,dairys,poultrys}  = require('./seeds/fruits')
const app = express();


const User = require('./models/user');
const MongoDBStore = require("connect-mongo")(session);



 const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/farm2palm';
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true ,useCreateIndex: true })
    .then(() => {
        console.log("Hello...mongo connection restored!!")
    })
    .catch((err) => {
        console.log("mongo connection error");
        console.log(err)
    })

    const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

    const store = new MongoDBStore({
        url: dbUrl,
        secret,
        touchAfter: 24 * 60 * 60
    });

    
store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash());




app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>{
   res.locals.success =  req.flash("success");
   res.locals.error = req.flash("error");
   res.locals.currentUser = req.user;
   if(!['/login','/logout','/cart'].includes(req.originalUrl)){
       req.session.returnTo = req.originalUrl;
   }
   next();
})

app.get('/', (req, res) => {
    req.session.cart = [];
    req.session.cart.push(5);
    req.session.cart.push(7);
    res.render('home');
});


app.get('/products', (req, res) => {
    res.render('index',{fruits,vegetables,dairys,poultrys})
});


app.get('/login', (req, res) => {
    res.render('login')
});






app.post('/login',passport.authenticate('local',{failureFlash:true, failureRedirect :'/login'}),async (req,res)=>{
    req.flash('success',`Welcome Back ${req.user.username}`);
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

app.post('/register',async (req,res)=>{
    try{
    const{username,email,password} = req.body;
    const user = new User({email,username});
    const regUser = await User.register(user,password);
     req.login(regUser,err=>{
         if(err)
         return next(err);
     })
     req.flash('success','Welcome to Farm2Palm')
    res.redirect('/');
    } catch(e){
        console.log(e.message)
        req.flash('error',e.message);
        res.redirect('/login');
    }

})

app.get('/logout',(req,res)=>{
    req.logout();
    req.flash('success','Logged out successfully');
    res.redirect('/login');
})

app.get('/fruit/:id',(req,res)=>{
    const idx = req.params.id;
    const product = fruits[idx];
    res.render('show',{product});
})

app.get('/vegetable/:id',(req,res)=>{
    const idx = req.params.id;
    const product = vegetables[idx];
    res.render('show',{product});
})


app.get('/dairy/:id',(req,res)=>{
    const idx = req.params.id;
    const product = dairys[idx];
    res.render('show',{product});
})

app.get('/poultry/:id',(req,res)=>{
    const idx = req.params.id;
    const product = poultrys[idx];
    res.render('show',{product});
})


app.get('/cart', async (req, res) => {
 // If user is not logged in
    if(!req.isAuthenticated())
    {
        req.flash('error','Please Sign in first');
        return res.redirect('/login');
    }
    const user = await User.findById(req.user._id);
    const cart = user.cart;
    res.render('cart',{cart});
})

app.post('/cart',async (req,res)=>{
    if(!req.isAuthenticated())
    {
        req.flash('error','Please Sign in first');
        const redirectUrl = req.session.returnTo;
        delete req.session.returnTo;
        return res.redirect(redirectUrl);
    }
    const {cartItem} = req.body;
    /*if(!req.session.cart)
    req.session.cart = [];
    req.session.cart.push(cartItem);*/
    const user = await User.findById(req.user._id);
    user.cart.push(cartItem);
    await user.save();
    req.flash('success','Succesfully added to the cart');
    const redirectUrl = req.session.returnTo;
        delete req.session.returnTo;
        return res.redirect(redirectUrl);
})

app.get('/cart/item/delete/:id',async (req,res)=>{
    const {id} = req.params;
    const user = await User.findById(req.user._id);
    user.cart.splice(id, 1);
    user.save();
    res.redirect('/cart');

})

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Serving on port 3000')
})


