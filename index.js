const env=require('dotenv');
env.config({path:'./.env'})
const express = require("express");
const arr = require("./modal");
const app = express();
const http = require("http");
const nodemailer = require('nodemailer');
const { Server } = require("socket.io");
const cors = require("cors");
const bcrypt = require('bcrypt');
const saltRounds = 10;


app.use(express.urlencoded({ extended: true }));
app.use(cors());
// app.use(express.json());
app.use(express.json({ limit: '10mb' }));
const collection = arr[0];
const collectionofroomchats = arr[1];


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`user connected : ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
  });

  socket.on("send_msg", (data) => {
    // console.log(data);
    //give message to every one  (broadcast)
    // socket.broadcast.emit("receive_msg",data);
    socket.to(data.room).emit("receive_msg", data);
  })
})


// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.myemail,
//     pass: process.env.myemailpassword,
//   },
// });
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'mychatswebsite@gmail.com',
      pass: 'saimanee'
  }
});
app.post('/otpverify', async (req, res) => {
  try {
    const { email, otp } = req.body;
console.log(email,otp);
    const mailOptions = {
      from: 'mychatswebsite@gmail.com',
      to: email,
      subject: 'Verification Code for Registration',
      text: `Your OTP is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.post("/Register", async (req, res) => {
  const { id, username, password, base64Stringimage } = req.body


  try {
    
    const check = await collection.findOne({ id: id })
    if (check) {
      //409 user already exist
      return res.status(202).json({ message: 'User already exists' });
    }
    else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          //unauthorized
          return res.status(401).json({ message: 'error in converting to hash' });
        } else {
          // Store the 'hash' in MongoDB
          const data = {
            id: id,
            username: username,
            password: hash,
            base64Stringimage: base64Stringimage
          }
          await collection.insertMany([data])
          //created successfully
          return res.status(201).json({ message: 'User registered successfully' });

        }
      });

    }

  }
  catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
})
app.post('/Login', async (req, res) => {
  try {
    const { id, password } = req.body;

    const user = await collection.findOne({ id }).exec(); // Use .exec() to execute the query

    if (!user) {
      res.status(202).json({ message: 'Invalid username or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      res.status(200).json({ message: 'Login successful', base64Stringimage: user.base64Stringimage });
    } else {
      res.status(202).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
app.post('/checkid', async (req, res) => {
  try {
    const { id } = req.body;
    const user = await collection.findOne({ id });
    if (user) {
      res.status(200).json({ message: 'user exist' });
    } else {
      res.status(401).json({ message: 'Invalid user' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
app.post('/addroomids', async (req, res) => {
  try {
    const { id, userid, roomid } = req.body;
    const result = await collection.updateOne(
      { id: userid },
      { $addToSet: { allroomids: roomid } }
    );
    const result2 = await collection.updateOne(
      { id: userid },
      { $addToSet: { privatefriendname: id } }
    );
    const result3 = await collection.updateOne(
      { id: id },
      { $addToSet: { allroomids: roomid } }
    );
    const result4 = await collection.updateOne(
      { id: id },
      { $addToSet: { privatefriendname: userid } }
    );
    res.status(200).json({ message: '' })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
app.post('/userdetails', async (req, res) => {
  try {
    const { id } = req.body;
    const user = await collection.findOne({ id });
    if (user) {
      res.status(200).json({ message: 'user exist', data: user });
    } else {
      res.status(401).json({ message: 'Invalid user' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
//rooms
app.post('/checkroomid', async (req, res) => {

  try {
    console.log(req.body);
    const { id } = req.body;

    const roomchats = await collectionofroomchats.findOne({ chatroomid: id });
    if (roomchats) {
      res.status(200).json({ message: 'room is present', data: roomchats });
    } else {
      const newRoomChat = { chatroomid: id };
      await collectionofroomchats.insertMany([newRoomChat]);
      res.status(401).json({ message: 'there is no chats for this room' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
app.post('/sendchats', async (req, res) => {

  try {
    const { roomid, chat, chatpersonid, time } = req.body;
    const result = await collectionofroomchats.updateOne(
      { chatroomid: roomid },
      {
        $push:
        {
          chat: chat,
          chatpersonid: chatpersonid,
          time: time
        }
      }

    );
    res.status(200).json({ message: '' })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/sendimages', async (req, res) => {

  try {
    const { roomid, chat, base64Stringimage, chatpersonid, time } = req.body;
    const result = await collectionofroomchats.updateOne(
      { chatroomid: roomid },
      {
        $push:
        {
          chat: chat,
          chatpersonid: chatpersonid,
          base64Stringimage: base64Stringimage,
          time: time
        }
      }

    );
    res.status(200).json({ message: '' })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



server.listen(5000, () => {
  console.log("server is running");
})