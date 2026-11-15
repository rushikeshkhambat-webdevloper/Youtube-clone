import dotenv from "dotenv"// to used this import way for dotenv we have to config it then only we can used it 
import connectDB from"./db/index.js"

import {app} from './app.js'
dotenv.config({
    path:'./env'
})
connectDB()
// as we know is an pormis and async work so it is promise so either we get response 
// or either we get rejection if we get response .then to work on it or either we will handle the error if we get reject 
.then(() => {
    const server = app.listen(process.env.PORT || 8000, () => {
        console.log("Server is listening on port ",process.env.PORT)
    });
})
.catch((err) => {
    console.log("MongoDB connection failed:", err);
});