import {v2 as cloudinary} from "cloudinary"

import fs from "fs"

cloudinary.config({
    cloud_name: 'dqowgwsoe',  //need to make account on cloudinary and set these values
    api_key: '844752164964913',
    api_secret: 'EYIJlDTzFrqaU-uVjW74GbRSp58'
});

console.log("cloudinary...",[cloudinary.config().api_key,process.env.CLOUDINARY_API_KEY]);

const uploadFileOnCloudinary = async (filepath) =>{
        
    try {
        if(!filepath) return null
        const response = await cloudinary.uploader.upload(filepath,{resource_type:"auto"})
        console.log("file succesfully uploaded on cloudinary",response.url)
        fs.unlinkSync(filepath);
        return response
        
    } catch (error) {
        console.log("error on uploading is ..",error);
        fs.unlinkSync(filepath)
        return null
    }
        

}

export { uploadFileOnCloudinary };