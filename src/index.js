

//console.log("start");
//require('dotenv').config();
import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
}

)

console.log("hello");

connectDb()
.then(() => {
    app.listen(process.env.PORT || 8000,() => {
        console.log(`Server is running on port, ${process.env.PORT}`)
    });
})
.catch((err) => {
    console.log(`Mongo DB connection Error ${err}`)
})



