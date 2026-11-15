import mongoose,{Schema} from "mongoose";


const subscriptionSchema=new Schema({
   subscriber:{
    type:Schema.Types.ObjectId,// one who is subsciribing 
    ref:"User"
   }
   channel:{
      type:Schema.Types.ObjectId,//one to whom subscirber is subscribing 
      ref:"User"
   }




},{timestamps:true})
export const Subscription= mongoose.model("Subscription",subscriptionSchema)