const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const FILE = path.join(__dirname, "users.json");

/* ================= LOAD USERS ================= */
const loadUsers = () => {
  try {
    if (!fs.existsSync(FILE)) {
      fs.writeFileSync(FILE, JSON.stringify([], null, 2));
    }

    const data = fs.readFileSync(FILE, "utf8");
    if (!data) return [];

    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading users:", error);
    return [];
  }
};

/* ================= SAVE USERS ================= */
const saveUsers = (users) => {
  try {
    fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users:", error);
  }
};

/* ================= REGISTER ================= */
app.post("/register", (req, res) => {
  const users = loadUsers();

  const {
    fullName,
    email,
    phone,
    password,
    role,

    // FARMER FIELDS
    farmName,
    barangay,
    municipality,
    province,
    farmPhoto,
    productPhoto,
    validID,
    farmerCert,
    rsbaCert,

    // BUYER FIELD
    photo,
  } = req.body;

  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const newUser = {
    id: Date.now().toString(),
    fullName,
    email,
    phone,
    password,
    role: role?.toLowerCase(),
    status: "pending",
    submitted: new Date().toLocaleDateString(),

    // Farmer fields
    farmName: farmName || null,
    barangay: barangay || null,
    municipality: municipality || null,
    province: province || null,
    farmPhoto: farmPhoto || null,
    productPhoto: productPhoto || null,
    validID: validID || null,
    farmerCert: farmerCert || null,
    rsbaCert: rsbaCert || null,

    // Buyer field
    photo: photo || null,
  };

  users.push(newUser);
  saveUsers(users);

  res.json({ message: "Registration submitted. Wait for approval." });
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  const users = loadUsers();
  const { email, password } = req.body;

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (user.status?.toLowerCase() !== "approved") {
    return res.status(403).json({ message: "Account not approved yet" });
  }

  res.json({
    message: "Login successful",
    role: user.role,
    fullName: user.fullName,
  });
});

/* ================= GET PENDING USERS ================= */
app.get("/admin/pending", (req, res) => {
  const users = loadUsers();

  const pendingUsers = users.filter(
    (u) => u.status?.toLowerCase() === "pending"
  );

  res.json(pendingUsers);
});

/* ================= ADMIN STATS ================= */
app.get("/admin/stats", (req, res) => {
  const users = loadUsers();

  const approvedUsers = users.filter(
    (u) => u.status?.toLowerCase() === "approved"
  );

  const farmerCount = approvedUsers.filter(
    (u) => u.role === "farmer"
  ).length;

  const buyerCount = approvedUsers.filter(
    (u) => u.role === "buyer"
  ).length;

  const pendingCount = users.filter(
    (u) => u.status?.toLowerCase() === "pending"
  ).length;

  res.json({
    totalUsers: {
      farmer: farmerCount,
      buyer: buyerCount,
    },
    total: farmerCount + buyerCount,
    pending: pendingCount,
  });
});

/* ================= APPROVE USER ================= */
app.put("/admin/approve/:id", (req, res) => {
  const users = loadUsers();

  const user = users.find((u) => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.status = "approved";
  saveUsers(users);

  res.json({ message: "User approved" });
});

/* ================= REJECT USER ================= */
app.put("/admin/reject/:id", (req, res) => {
  let users = loadUsers();

  const originalLength = users.length;

  users = users.filter((u) => u.id !== req.params.id);

  if (users.length === originalLength) {
    return res.status(404).json({ message: "User not found" });
  }

  saveUsers(users);

  res.json({ message: "User rejected" });
});

/* ================= START SERVER ================= */
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});