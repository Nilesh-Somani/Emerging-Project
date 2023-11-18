// modules used
const { log } = require("console");
const express = require("express"),
  { MongoClient } = require("mongodb");
bcrypt = require("bcrypt"),
  client = new MongoClient('mongodb+srv://root:root201123@qrattendance.gzdv2bn.mongodb.net'),
  path = require("path"),
  app = express();

let user = {
  name: {
    type: String,
    value: null
  },
  password: {
    type: String,
    value: null
  },
  section: {
    type: String,
    value: null
  },
  subject: {
    type: String,
    value: null
  },
}
let pageNotFound = "<div style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;'><h1>404 : Page Not Found</h1><button style='font-size:22; padding: 5px;'><a href='/' style='text-decoration: none; color: black;'>Home Page</a></button></div>"

app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("login")
});

app.post("/", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const subject = req.body.subject;
  const foundUser = await client.db("Qrcode").collection("faculties").findOne({ name: username, password: password, subject: subject });
  if (!foundUser) {
    res.send("<h1>User Not Found.</h1><button style='font-size:22; padding: 5px'><a href='/' style='text-decoration: none; color: black;'>Re-Login</a></button>");
    return;
  }
  user.name.value = foundUser.name;
  user.password.value = foundUser.password;
  user.section.value = foundUser.section || null;
  user.subject.value = foundUser.subject || null;
  if (user.name.value !== "Admin") res.redirect("/qrcode");
  else res.redirect("/profile");
});

app.get("/forget", (req, res) => {
  res.render("forget", { user: user });
});

app.post("/forget", async (req, res) => {
  const check = await client.db("Qrcode").collection("faculties").find({ name: req.body.username, password: req.body.password, subject: req.body.subject });
  if (!check) {
    res.send("<h1>User Not Found. Can't Forget Password.</h1><button style='font-size: 22; padding: 5px'><a href='/forget' style='text-decoration: none; color: black;'>Forget Page</a></button>");
  } else if (check) {
    const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
    if (req.new_password == req.password_configure) {
      const data = {
        name: req.body.username,
        password: req.body.new_password
      }
      if (await faculties.updateOne(data)) {
        res.send("<h1>Password Changed.</h1><button style='font-size: 22; padding: 5px><a href='/' style='text-decoration: none; color: black;'>Login</a></button>");
      } else {
        res.send("<h1>Password Couldn't Be Changed.</h1><button style='font-size: 22; padding: 5px><a href='/forget' style='text-decoration: none; color: black;'>Re-Forget</a></button>");
      }
    }
  } else {
    res.send("<h1>Password Does Not Match. Can't Forget Password.</h1><button style='font-size: 22; padding: 5px;'><a href='/' style='text-decoration: none; color: black;'>Re-Forget</a></button>");
  }
})

app.get("/QRCode", async (req, res) => {
  if (user.name.value !== null) {
    const student = await client.db("Qrcode").collection("students").find({ subject: user.subject.value, section: user.section.value }).sort({ name: 1 });
    const students = await student.toArray();
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const attendance = await client.db("Qrcode").collection("attendances").find({ date: `${day}-${month}-${year}`, subject: user.subject.value }, { projection: { _id: 0 } })
    const attendances = await attendance.toArray();
    res.render("qrcode", {
      student: students,
      tableStudent: students,
      attendance: attendances
    })
  } else {
    res.send(pageNotFound);
  }
});

app.post("/qrcode", async (req, res) => {
  if (user.name.value !== null) {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    if (req.body.id == "77") {
      const mark = req.body.result;
      const mark_uid = await client.db("Qrcode").collection("attendances").findOne({ uid: mark, subject: user.subject.value, date: `${day}-${month}-${year}` });
      if (!mark_uid) {
        const result = await client.db("Qrcode").collection("attendances").insertOne({ uid: mark, subject: user.subject.value, date: `${day}-${month}-${year}`, presence: true });
        if (result.matchedCount == 0) {
          res.send("<h1>Couldn't Mark Attendance.</h1><button style='font-size: 22; padding: 5px'><a href='/qrcode' style='text-decoration: none; color: black;'>Re-mark</a></button>")
        }
      } else if (mark_uid.hasOwnProperty('presence')) {
        await client.db("Qrcode").collection("attendances").updateOne({ uid: mark, subject: user.subject.value, date: `${day}-${month}-${year}` }, { $set: { presence: true } });
      } else {
        res.send("<h1>Attendance Already Marked.</h1><button style='font-size: 22; padding: 5px'><a href='/qrcode' style='text-decoration: none; color: black;'>Go Back</a></button>");
        return;
      }
      const updatedAttendance = await client.db("Qrcode").collection("attendances").find({ date: `${day}-${month}-${year}`, subject: user.subject.value });
      const mark_attendances = await updatedAttendance.toArray();
      const mark_student = await client.db("Qrcode").collection("students").find({ subject: user.subject.value, section: user.section.value }).sort({ name: 1 });
      const mark_students = await mark_student.toArray();
      res.render("qrcode", {
        student: mark_students,
        tableStudent: mark_students,
        attendance: mark_attendances
      });
    } else if (req.body.id == "12") {
      const absentStudents = await client.db("Qrcode").collection("students").find({ subject: user.subject.value, section: user.section.value }).toArray();
      absentStudents.forEach(async student => {
        const marked_uid = student.uid;
        const attendanceRecord = await client.db("Qrcode").collection("attendances").findOne({ uid: marked_uid, subject: user.subject.value, date: `${day}-${month}-${year}`, presence: true });
        if (!attendanceRecord) {
          await client.db("Qrcode").collection("attendances").insertOne({ uid: marked_uid, subject: user.subject.value, date: `${day}-${month}-${year}`, presence: false });
        }
      });
      const marked_attendance = await client.db("Qrcode").collection("attendances").find({ date: `${day}-${month}-${year}`, subject: user.subject.value }).sort({ name: 1 });
      const marked_attendances = await marked_attendance.toArray();
      res.render("qrcode", {
        student: absentStudents,
        tableStudent: absentStudents,
        attendance: marked_attendances
      });
    } else if (req.body.id == "83") {
      const search_uid = req.body.search_uid;
      const search_name = req.body.search_name;
      const search_subject = req.body.search_subject;
      const search_section = req.body.search_section;
      const search_groupNo = req.body.search_groupNo;
      const search_date = req.body.search_date;
      let search_query = {};
      let search_que = {};
      if (search_uid) {
        search_query.uid = search_uid;
        search_que.uid = search_uid;
      }
      if (search_name) {
        search_query.name = { $regex: `.*${search_name}.*`, $options: 'i' };
        const searched_uid = await client.db("Qrcode").collection("students").find({ name: search_query.name }).toArray();
        if (search_que.uid !== searched_uid.uid) {
          search_que.uid = searched_uid.uid;
        }
      }
      if (search_subject) {
        search_query.subject = search_subject;
        search_que.subject = search_subject;
      }
      if (search_section) search_query.section = search_section;
      if (search_groupNo) search_query.groupNo = search_groupNo;
      if (search_date) {
        search_que.date = search_date;
      }
      if (search_que.length == 0) {
        search_que.date = `${day}-${month}-${year}`;
      }
      const searched = await client.db("Qrcode").collection("students").find(search_query).sort({ name: 1 });
      const searchedArray = await searched.toArray();
      const search_student = await client.db("Qrcode").collection("students").find({ subject: user.subject.value, section: user.section.value }).sort({ name: 1 });
      const search_students = await search_student.toArray();
      if (searchedArray.length > 0) {
        const search_attendance = await client.db("Qrcode").collection("attendances").find(search_que).sort({ name: 1 });
        const search_attendances = await search_attendance.toArray();
        res.render("qrcode", {
          student: search_students,
          tableStudent: searchedArray,
          attendance: search_attendances
        });
      } else {
        res.send("<h1>Couldn't Find Student.</h1><button style='font-size: 22; padding: 5px'><a href='/qrcode' style='text-decoration: none; color: black;'>Re-try</a></button>")
      }
    } else if (req.body.id == "67") {
      const create_uid = req.body.create_uid;
      const create_name = req.body.create_name;
      const create_subject = req.body.create_subject;
      const create_section = req.body.create_section;
      const create_groupNo = req.body.create_groupNo;
      if (create_uid !== "" && create_name !== "" && create_subject !== "" && create_section !== "" && create_groupNo !== "") {
        const newStudent = await client.db("Qrcode").collection("students").insertOne({ uid: create_uid, name: create_name, section: create_section, subject: create_subject, groupNo: create_groupNo })
        if (newStudent) {
          const allStudent = await client.db("Qrcode").collection("students").find({ subject: user.subject.value, section: user.section.value }).sort({ name: 1 });
          const create_students = await allStudent.toArray();
          const create_attendance = await client.db("Qrcode").collection("attendances").find({ date: `${day}-${month}-${year}`, subject: user.subject.value }).sort({ name: 1 });
          const create_attendances = await create_attendance.toArray();
          res.render("qrcode", {
            student: create_students,
            tableStudent: create_students,
            attendance: create_attendances
          });
        } else {
          res.send("<h1>Couldn't Find Student.</h1><button style='font-size: 22; padding: 5px'><a href='/qrcode' style='text-decoration: none; color: black;'>Re-try</a></button>")
        }
      } else {
        res.send("<h1>Couldn't Create New Student.</h1><button style='font-size: 22; padding: 5px'><a href='/qrcode' style='text-decoration: none; color: black;'>Re-try</a></button>")
      }
    } else if (req.body.id == "69") {
      const edit_uid = req.body.edit_uid;
      const edit_name = req.body.edit_name;
      const edit_subject = req.body.edit_subject;
      const edit_section = req.body.edit_section;
      const edit_groupNo = req.body.edit_groupNo;
      const edit_date = req.body.edit_date;
      const edit_presence = Boolean(req.body.edit_presence);
      let edit_query = {};
      let edit_updated = {};
      let edit_attend = {};
      if (edit_uid) {
        edit_query.uid = edit_uid;
        edit_attend.uid = edit_uid;
      }
      if (edit_name) edit_query.name = { $regex: `.*${edit_name}.*`, $options: 'i' };
      if (edit_subject) edit_updated.subject = edit_subject;
      if (edit_section) edit_updated.section = edit_section;
      if (edit_groupNo) edit_updated.groupNo = edit_groupNo;
      if (edit_date) {
        edit_attend.date = edit_date;
        if (edit_presence) {
          edit_attend.presence = edit_presence;
        }
      }
      if (edit_updated.subject && edit_date && edit_presence) {
        const edit_student = await client.db("Qrcode").collection("students").updateOne(edit_query, { $set: edit_updated });
        if (edit_student.matchedCount !== 0 && edit_student.modifiedCount !== 0) {
          await client.db("Qrcode").collection("attendances").updateOne({ uid: edit_uid, subject: edit_subject, date: edit_date }, { $set: { presence: edit_presence } });
        } else {
          res.send("<h1>Couldn't Update Student.</h1><button style='font-size: 22; padding: 5px'><a href='/qrcode' style='text-decoration: none; color: black;'>Re-try</a></button>");
          return;
        }
      } else if (!edit_updated.subject && edit_date && edit_presence) {
        if (edit_section) {
          await client.db("Qrcode").collection("students").updateOne(edit_query, { $set: edit_updated });
        }
        await client.db("Qrcode").collection("attendances").updateOne({ uid: edit_uid, subject: user.subject.value, date: edit_date }, { $set: { presence: edit_presence } });
      } else if (edit_updated) {
        await client.db("Qrcode").collection("students").updateOne(edit_query, { $set: edit_updated });
      }
      const edit_allStudent = await client.db("Qrcode").collection("students").find({ subject: user.subject.value, section: user.section.value }).sort({ name: 1 });
      const edit_students = await edit_allStudent.toArray();
      const edit_attendance = await client.db("Qrcode").collection("attendances").find({ date: `${day}-${month}-${year}`, subject: user.subject.value }).sort({ name: 1 });
      const edit_attendances = await edit_attendance.toArray();
      res.render("qrcode", {
        student: edit_students,
        tableStudent: edit_students,
        attendance: edit_attendances
      });
    } else if (req.body.id == "68") {
      const delete_uid = req.body.delete_uid;
      const delete_name = req.body.delete_name;
      const delete_date = req.body.delete_date;
      let delete_query = {};
      let delete_que = {}
      if (delete_uid) {
        delete_query.uid = delete_uid;
        delete_que.uid = delete_uid;
      }
      if (delete_name) {
        delete_query.name = { $regex: `.*${delete_name}.*`, $options: 'i' }
      }
      if (delete_date) {
        delete_que.data = delete_date;
      }
      if (delete_uid && delete_date) {
        await client.db("Qrcode").collection("attendances").updateOne(delete_que, { $set: { presence: false } });
      } else if (delete_uid && !delete_date) {
        const delete_result = await client.db("Qrcode").collection("students").deleteOne(delete_query);
        if (delete_result.matchedCount !== 0) {
          await client.db("Qrcode").collection("attendances").deleteMany(delete_que);
        }
      } else if (!delete_uid && delete_date && delete_name) {
        const findStudent_uid = await client.db("Qrcode").collection("students").findOne({ name: delete_name });
        await client.db("Qrcode").collection("attendances").updateOne({ uid: findStudent_uid.uid, subject: user.subject.value, date: `${day}-${month}-${year}` }, { $set: { presence: false } });
      } else if (delete_date && !delete_name) {
        await client.db("Qrcode").collection("attendances").updateMany({ subject: user.subject.value, date: `${day}-${month}-${year}` }, { $set: { presence: false } });
      } else if (!delete_date && delete_name) {
        const findStudent_name = await client.db("Qrcode").collection("students").findOne({ name: delete_name });
        const delete_result = await client.db("Qrcode").collection("students").deleteOne(delete_query);
        if (delete_result.matchedCount !== 0) {
          await client.db("Qrcode").collection("attendances").deleteMany({ uid: findStudent_name.uid, subject: user.subject.value });
        }
      } else {
        res.send("<h1>Couldn't Delete Student.</h1><button style='font-size: 22; padding: 5px'><a href='/qrcode' style='text-decoration: none; color: black;'>Re-try</a></button>")
        return;
      }
      const deleted_allStudent = await client.db("Qrcode").collection("students").find({ subject: user.subject.value, section: user.section.value }).sort({ name: 1 });
      const deleted_students = await deleted_allStudent.toArray();
      const deleted_attendance = await client.db("Qrcode").collection("attendances").find({ date: `${day}-${month}-${year}`, subject: user.subject.value }).sort({ name: 1 });
      const deleted_attendances = await deleted_attendance.toArray();
      res.render("qrcode", {
        student: deleted_students,
        tableStudent: deleted_students,
        attendance: deleted_attendances
      });
    }
  } else {
    res.send(pageNotFound);
  }
});
app.get("/profile", (req, res) => {
  if (user.name.value !== null) {
    res.render("profile", { user: user })
  } else {
    res.send(pageNotFound);
  }
});

app.post("/profile", async (req, res) => {
  if (user.name.value !== null) {
    if (req.body.id == "65") {
      const username = req.body.new_username;
      const password = req.body.new_password;
      const subject = req.body.new_subject;
      const section = req.body.new_section;
      const result = await client.db("Qrcode").collection("faculties").find({ name: username });
      if (result.length == 0) {
        res.send("<h1>User Already Exist.</h1><button style='font-size: 22; padding: 5px'><a href='/profile' style='text-decoration: none; color: black;'>Re-try</a></button>")
      } else {
        const new_user = await client.db("Qrcode").collection("faculties").insertOne({ name: username, password: password, subject: subject, section: section })
        if (new_user) {
          res.send("<h1>User Added.</h1><button style='font-size: 22; padding: 5px'><a href='/profile' style='text-decoration: none; color: black;'>Profile Page</a></button>");
        } else {
          res.send("<h1>Couldn't Add User.</h1><button style='font-size: 22; padding: 5px'><a href='/profile' style='text-decoration: none; color: black;'>Re-Try</a></button>");
        }
      }
    } else if (req.body.id == "68") {
      const username = req.body.delete_username;
      const result = await client.db("Qrcode").collection("faculties").deleteOne({ name: username });
      if (result.length !== 0) {
        res.send("<h1>User Deleted.</h1><button style='font-size: 22; padding: 5px'><a href='/profile' style='text-decoration: none; color: black;'>Profile Page</a></button>");
      } else {
        res.send("<h1>Couldn't Delete User.</h1><button style='font-size: 22; padding: 5px'><a href='/profile' style='text-decoration: none; color: black;'>Re-try</a></button>")
      }
    }
  } else {
    res.send(pageNotFound);
  }
})

app.get("/update_user", async (req, res) => {
  if (user.name.value !== null) {
    if (user.name == "Admin") {
      res.render("forget");
    } else {
      res.render("update", { user: user });
    }
  } else {
    res.send(pageNotFound);
  }
})

app.post("/update_user", async (req, res) => {
  if (user.name.value !== null) {
    const username = req.body.new_username;
    const password = req.body.new_password;
    const subject = req.body.new_subject;
    const section = req.body.new_section;
    let updated = {$set: {}};
    if (username) updated.$set.name = username;
    if (password) updated.$set.password = password;
    if (subject) updated.$set.subject = subject;
    if (section) updated.$set.section = section;
    const result = client.db("Qrcode").collection("faculties").updateOne({ name: user.name.value },  updated );
    if (result) {
      for (let i = 0; i < user.length; i++) {
        user[i].value = null;
      }
      res.redirect("/");
    } else {
      res.send("<h1>Couldn't Change Details.</h1><button style='font-size: 22; padding: 5px'><a href='/update_user' style='text-decoration: none; color: black;'>Re-try</a></button>")
    }
  } else {
    res.send(pageNotFound);
  }
})

app.get("/logout", (req, res) => {
  if (user.name.value !== null) {
    user.name.value = user.password.value = user.section.value = user.subject.value = null;
    res.redirect("/");
  } else {
    res.send(pageNotFound);
  }
})

app.listen(3000, async () => {
  try {
    client.connect();
  } catch (err) {
    console.log(err);
  }
});