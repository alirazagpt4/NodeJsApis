// console.log("working");
const { create } = require("domain");
const express = require("express");
const app = express();
const port = 5000;
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose");
const { type } = require("os");
const secret   = "abc123ABC321";

// mongo db connection
async function conn(){
mongoose.connect("mongodb://localhost:27017/userDb", { useNewUrlParser: true, useUnifiedTopology: true })
 .then(() => console.log("MongoDB connected..."))
}
conn();
// built-in middleware
app.use(express.json());
// Schema with mongooose
const userSchema = new mongoose.Schema({
    username : {type : String , required:true},
    email : {type : String , required:true},
    password : {type : String , required:true},
})
// creating a model
const User = mongoose.model("User", userSchema);

app.get("/" , (req , res)=>{
     return res.json("api is working");
})

app.post("/login", async(req, res) =>{
    const {email , password} = req.body;
    const user = await User.findOne({email , password});
    if(!user){
        return res.status(401).json({message : "Invalid credentials"});
    }
    const token = jwt.sign({id:user._id , email : user.email , password : user.password} , secret);
    return res.status(200).json({
        message : "Login successful",
        token : token
    });

});


app.post("/signup" , async(req , res)=>{
    const {username , email , password} = req.body;
    const newUser = await User.create({
        username,
        email,
        password
    });

    return res.status(200).json({
        message : "data inserted successfully",
        data : newUser
    });
})


// middlewre to decode token
const authenticate = (req , res , next)=>{
    const token = req.headers.token;
    if(!token){
        return res.status(401).json({
            message : "Access Denied",
        })
    }

    const decoded = jwt.verify(token , secret);
    req.user = decoded;
    next();
}

// protected route  with jwt authentication  and middleware authenticate()
app.get("/protected" , authenticate, (req, res) =>{    
    return res.json({
        message : "Welcome to the protected route"
})
});

// update 
app.put("/update", authenticate, async (req, res) => {
    try {
        const { id } = req.user; 
        const { username, email, password } = req.body;

       
        const updateUser = await User.findByIdAndUpdate(
            id,
            { username, email, password },
            { new: true, runValidators: true } 
        );

        if (!updateUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Data updated successfully",
            data: updateUser,
        });
    } catch (error) {
        return res.status(500).json({
            message: "An error occurred",
            error: error.message,
        });
    }
});


// delete
app.delete("/delete", authenticate, async (req, res) => {
   const {id} = req.user;
   try{
        const deleteUser = await User.findByIdAndDelete(id);
        return res.status(200).json({
            message : "User deleted successfully",
            data : deleteUser
        })
   }
   catch(err){
         return res.status(401).json({
              message : "Error While Deleting user"
         })
   }
});


app.listen(
    port,
    () => console.log(`Server running on port ${port}`)
);