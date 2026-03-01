const admin = require("../firebase"); // 🔥 import initialized firebase

const sendPush = async (token, title, body, data = {}) => {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data,
    });
 
    console.log("✅ Push sent successfully");
  } catch (error) {
    console.log("❌ Push error:", error);
  }
};

module.exports = sendPush;