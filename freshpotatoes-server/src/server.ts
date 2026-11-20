import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==================== 1. SIMPLE AUTH ====================
// Login หรือ Auto-register แบบง่ายด้วย Email (และ Password ถ้ามี)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          password: password || "1234",
        },
      });
    } else if (password && user.password && user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ==================== 2. MOVIES (CRUD) ====================
// ดึงรายการหนังทั้งหมด + ค้นหา + กรองตาม Genre
app.get("/api/movies", async (req, res) => {
  try {
    const { search, genre } = req.query;
    const movies = await prisma.movie.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: String(search), mode: "insensitive" } },
                  {
                    director: { contains: String(search), mode: "insensitive" },
                  },
                  { actors: { contains: String(search), mode: "insensitive" } },
                ],
              }
            : {},
          genre && genre !== "All"
            ? { genre: { contains: String(genre), mode: "insensitive" } }
            : {},
        ],
      },
      include: { reviews: true },
      orderBy: { id: "asc" },
    });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// ดึงรายละเอียดหนังรายเรื่อง (พร้อมรีวิวและชื่อผู้รีวิว)
app.get("/api/movies/:id", async (req, res) => {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        reviews: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movie details" });
  }
});

// เพิ่มหนังเรื่องใหม่ (Create Movie)
app.post("/api/movies", async (req, res) => {
  try {
    const newMovie = await prisma.movie.create({ data: req.body });
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ error: "Failed to create movie" });
  }
});

// แก้ไขข้อมูลหนัง (Update Movie)
app.put("/api/movies/:id", async (req, res) => {
  try {
    const updated = await prisma.movie.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update movie" });
  }
});

// ลบหนัง (Delete Movie)
app.delete("/api/movies/:id", async (req, res) => {
  try {
    await prisma.movie.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Movie deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

// ==================== 3. REVIEWS (CRUD) ====================
// สร้างรีวิวใหม่
app.post("/api/reviews", async (req, res) => {
  try {
    const { rating, comment, userId, movieId } = req.body;
    const review = await prisma.review.create({
      data: {
        rating: Number(rating),
        comment,
        userId: Number(userId),
        movieId: Number(movieId),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to create review" });
  }
});

// แก้ไขรีวิว
app.put("/api/reviews/:id", async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const updated = await prisma.review.update({
      where: { id: Number(req.params.id) },
      data: { rating: Number(rating), comment },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update review" });
  }
});

// ลบรีวิว
app.delete("/api/reviews/:id", async (req, res) => {
  try {
    await prisma.review.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// ==================== 4. PERSONAL COLLECTION (WATCHLIST / FAVORITES) ====================
// ดึงรายการคอลเลกชันของผู้ใช้
app.get("/api/collections/:userId", async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { userId: Number(req.params.userId) },
      include: { movie: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

// เพิ่มหนังเข้าคอลเลกชันส่วนตัว
app.post("/api/collections", async (req, res) => {
  try {
    const { userId, movieId } = req.body;
    const item = await prisma.collection.create({
      data: { userId: Number(userId), movieId: Number(movieId) },
      include: { movie: true },
    });
    res.status(201).json(item);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Movie already in collection or invalid data" });
  }
});

// ลบหนังออกจากคอลเลกชันส่วนตัว
app.delete("/api/collections/:userId/:movieId", async (req, res) => {
  try {
    await prisma.collection.delete({
      where: {
        userId_movieId: {
          userId: Number(req.params.userId),
          movieId: Number(req.params.movieId),
        },
      },
    });
    res.json({ message: "Removed from collection" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from collection" });
  }
});

app.listen(PORT, () => {
  console.log(`freshpotatoes-server running on http://localhost:${PORT}`);
});

// ดึงรายการรีวิวทั้งหมดของผู้ใช้คนนั้น (พร้อมข้อมูลหนัง)
app.get("/api/reviews/user/:userId", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: Number(req.params.userId) },
      include: { movie: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});
