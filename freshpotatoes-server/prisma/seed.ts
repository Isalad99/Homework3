import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ล้างข้อมูลเก่าก่อน Seed
  await prisma.collection.deleteMany();
  await prisma.review.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  // สร้าง User ตัวอย่าง
  const user1 = await prisma.user.create({
    data: {
      email: "noppachet@example.com",
      name: "Noppachet",
      password: "1234",
    },
  });

  // สร้างข้อมูลหนังตัวอย่าง 6 เรื่อง
  await prisma.movie.createMany({
    data: [
      {
        title: "Inception",
        year: "2010",
        rated: "PG-13",
        runtime: "148 min",
        genre: "Action, Adventure, Sci-Fi",
        director: "Christopher Nolan",
        actors: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page",
        plot: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        poster:
          "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
        imdbRating: "8.8",
      },
      {
        title: "Interstellar",
        year: "2014",
        rated: "PG-13",
        runtime: "169 min",
        genre: "Adventure, Drama, Sci-Fi",
        director: "Christopher Nolan",
        actors: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
        plot: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        poster:
          "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
        imdbRating: "8.7",
      },
      {
        title: "The Dark Knight",
        year: "2008",
        rated: "PG-13",
        runtime: "152 min",
        genre: "Action, Crime, Drama",
        director: "Christopher Nolan",
        actors: "Christian Bale, Heath Ledger, Aaron Eckhart",
        plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        poster:
          "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
        imdbRating: "9.0",
      },
      {
        title: "Dune: Part Two",
        year: "2024",
        rated: "PG-13",
        runtime: "166 min",
        genre: "Action, Adventure, Drama",
        director: "Denis Villeneuve",
        actors: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
        plot: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
        poster:
          "https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtODhmNDI1NmY5YzAwXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_SX300.jpg",
        imdbRating: "8.5",
      },
      {
        title: "Parasite",
        year: "2019",
        rated: "R",
        runtime: "132 min",
        genre: "Drama, Thriller",
        director: "Bong Joon Ho",
        actors: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong",
        plot: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        poster:
          "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg",
        imdbRating: "8.5",
      },
      {
        title: "Spider-Man: Across the Spider-Verse",
        year: "2023",
        rated: "PG",
        runtime: "140 min",
        genre: "Animation, Action, Adventure",
        director: "Joaquim Dos Santos, Kemp Powers, Justin K. Thompson",
        actors: "Shameik Moore, Hailee Steinfeld, Brian Tyree Henry",
        plot: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
        poster:
          "https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_SX300.jpg",
        imdbRating: "8.6",
      },
    ],
  });

  const firstMovie = await prisma.movie.findFirst();
  if (firstMovie) {
    await prisma.review.create({
      data: {
        rating: 5,
        comment: "หนังดีมาก ภาพสวยและเนื้อเรื่องซับซ้อนน่าติดตาม",
        userId: user1.id,
        movieId: firstMovie.id,
      },
    });

    await prisma.collection.create({
      data: {
        userId: user1.id,
        movieId: firstMovie.id,
      },
    });
  }

  console.log("Seed data (6 movies) created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
