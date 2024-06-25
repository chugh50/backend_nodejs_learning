import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"



const connectDb = async () => {
                            try {
                                console.log(`${process.env.MONGODB_URI}/${DB_NAME}`)
                                const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
                                console.log(`connect mongodb...,${connectionInstance}`)
                                

                                } catch (error) {
                                    console.error("MONGO DB CONNECTION FAILED", error)
                                    }
                    }    

export default connectDb            