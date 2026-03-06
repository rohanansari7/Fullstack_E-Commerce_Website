class ErrorHandler extends Error {
    constructor(statusCode, message) {
        super(message);    
        this.statusCode = statusCode;
    }
}

export const handleError = (err, req, res, next) => {
    // if (process.env.NODE_ENV === 'production') {
    //     console.error(err);
    // }

    // next();

    err.message = err.message || 'Internal Server Error';
    err.statusCode = err.statusCode || 500;

    if(err.code === 11000) {
        const message = `Duplicate field value entered for field, please use another value!`;
        err = new ErrorHandler(400, message);
    }

    if(err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        err = new ErrorHandler(400, message);
    }

    if(err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        err = new ErrorHandler(404, message);
    }

    if(err.name === 'JsonWebTokenError') {
        const message = 'JSON Web Token is invalid. Please try again!';
        err = new ErrorHandler(401, message);
    }

    if(err.name === 'TokenExpiredError') {
        const message = 'JSON Web Token is expired. Please try again!';
        err = new ErrorHandler(401, message);
    }

    console.error(err);

    const errorMessage = err.errors ? Object.values(err.errors).map(error => error.message).join(', ') : err.message;

    res.status(err.statusCode).json({
        success: false,
        error: errorMessage
    });

}


export default ErrorHandler;