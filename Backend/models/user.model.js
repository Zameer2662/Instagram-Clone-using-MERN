import mongoose, { mongo } from "mongoose";

const userschema = new mongoose.Schema({
    username: {type:String ,required:true ,unique:true },
    email:{type:String ,required:true,unique:true},
    password:{type:String , required:true},
    profilePicture:{type:String,default:''},
    bio:{type:String,default:''},
    gender:{type:String,enum:['male','female']},
    followers:[{type:mongoose.Schema.Types.ObjectId,ref:'user'}],
    following:[{type:mongoose.Schema.Types.ObjectId,ref:'user'}],
    posts:[{type:mongoose.Schema.Types.ObjectId,ref:'Post'}],
    bookmarks:[{type:mongoose.Schema.Types.ObjectId,ref:'Post'}],

},{timestamps:true});
export const User= mongoose.model('User',userschema);


