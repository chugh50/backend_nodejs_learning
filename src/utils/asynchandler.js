
const asyncHandler = (requestHandler) => {
    return (req,resp,next) => {
        Promise
        .resolve(requestHandler(req,resp,next))
        .catch((error) => {next(error)})
    }
    
} 

export { asyncHandler }