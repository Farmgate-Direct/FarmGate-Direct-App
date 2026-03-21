// const fs = require("fs");
// const path = require("path");

// const FILE = path.join(__dirname, "../users.json");

// /* LOAD USERS */
// const loadUsers = () => {
//   if (!fs.existsSync(FILE)) {
//     fs.writeFileSync(FILE, JSON.stringify([], null, 2));
//   }

//   const data = fs.readFileSync(FILE, "utf8");
//   return data ? JSON.parse(data) : [];
// };

// /* SAVE USERS */
// const saveUsers = (users) => {
//   fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
// };

// /* ================= GET USER PROFILE ================= */
// const getUserProfile = (req, res) => {
//   try {
//     const users = loadUsers();
//     const user = users.find((u) => u.id === req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json(user);
//   } catch (err) {
//     console.log("GET PROFILE ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /* ================= UPDATE USER PROFILE ================= */
// const updateUserProfile = (req, res) => {
//   try {
//     const users = loadUsers();
//     const index = users.findIndex((u) => u.id === req.params.id);

//     if (index === -1) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     users[index] = {
//       ...users[index],
//       ...req.body,
//     };

//     saveUsers(users);

//     res.json(users[index]);
//   } catch (err) {
//     console.log("UPDATE PROFILE ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = {
//   getUserProfile,
//   updateUserProfile,
// };
const path = require("path");
const { readJSON, writeJSON } = require("../utils/filehelper");

const FILE = path.join(__dirname, "../data/users.json");

/* ================= GET USER ================= */
const getUser = (req, res) => {
  try {
    const users = readJSON(FILE);const user = users.find(
  (u) => String(u.id) === String(req.params.id)
);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.log("GET USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= PATCH USER ================= */
const updateUser = (req, res) => {
  try {
    const users = readJSON(FILE);
    const index = users.findIndex(
      (u) => String(u.id) === String(req.params.id),
    );

    if (index === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // merge lang (important sa profile edit mo)
    users[index] = {
      ...users[index],
      ...req.body,
    };

    writeJSON(FILE, users);

    res.json(users[index]);
  } catch (err) {
    console.log("UPDATE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUser,
  updateUser,
};
