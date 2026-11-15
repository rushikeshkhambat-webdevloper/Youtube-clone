import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// lets make and app with expres 
const app= express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true


}))
app.use(express.json({limit:"16kb"}))// when data will came from user it will in json and it should have some limit so our server should not get crasshed 
app.use(express.urlencoded({extended:true, limit:"16kb"})) // that if url changed it should get work 
app.use(express.static("public"))
app.use(cookieParser())

app.use((req, res, next) => {
    console.log("INCOMING REQUEST:", req.method, req.url);
    next();
});

// routes import

import userRouter from './routes/user.routes.js';



//routes declaration 
// hence we are writing routes seperately to used them in app.js we need a middleware for it 
app.use("/api/v1/users",userRouter)
// it menas that go to http/localhost:8000/api/v1/user/register then it will run the controller and give us and ok message 

export{app}