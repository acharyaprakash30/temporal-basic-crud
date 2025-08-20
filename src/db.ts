import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("temporal_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ alter: true }); 
    console.log("✅ Models synchronized");
  } catch (error) {
    console.error("❌ DB Connection failed:", error);
  }
};
