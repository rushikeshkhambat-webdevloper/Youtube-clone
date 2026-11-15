// now we are going to talk to the db so many time so instead of writeing db code again and again we will write it one time only 
// two ways one is using promist second is using async try catch 
//promise 
const asyncHandler=(requestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))// here we write in advanced form it same like and .then.catch resolve=.then only and just write it in easy syntax 
    }

}
export  {asyncHandler};