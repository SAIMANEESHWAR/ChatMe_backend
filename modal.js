const env=require('dotenv');
env.config({path:'./.env'})
const mongoose=require("mongoose");

mongoose.connect(process.env.Mongo)
.then(()=>{
    console.log("mongo connected");
})
.catch(()=>{
    console.log("mongo not connected");
})

const sschema=new mongoose.Schema({
    id:{
        type:String,
        required:true
    },
    username:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    base64Stringimage:{
        type:String,
        require:true
    },
    allroomids: [
        {
          type: String,
        },
      ],
      privatefriendname: [
        {
          type: String,
        },
      ],
    
})


const myroomchats=new mongoose.Schema({
  chatroomid:{
      type:String,
      required:true
  },
  chat:[
    {
      type: String,
    },
  ],
  chatpersonid:[
    {
      type: String,
    },
  ],
  base64Stringimage:[
    {
      type: String,
    },
  ],
  time: [
      {
        type: String,
      },
    ],
  
  
})
const collection=mongoose.model("collection",sschema);
const collectionofroomchats=mongoose.model("collectionofroomchats",myroomchats);
const arr=[collection,collectionofroomchats];
module.exports=arr;
