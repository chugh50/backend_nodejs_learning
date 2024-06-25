class ApiError extends Error{
    constructor(statusCode,message = "Something went wrong",errors = [],stack = ""){

        super(message);
        this.statuscode = statuscode;
        this.message = message;
        this.errors = errors;
        this.success = false;
        this.data = null;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

        

    }



}

export {ApiError}