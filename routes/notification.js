const express = require("express");
const Notification = require("../models/Notification");
const Interview = require("../models/Interview");
const mongoose = require("mongoose");

const router = express.Router();

// // ✅ Check and add notifications for interviews happening tomorrow
// const checkUpcomingInterviews = async () => {
//   try {
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     tomorrow.setHours(0, 0, 0, 0);

//     const nextDay = new Date(tomorrow);
//     nextDay.setHours(23, 59, 59, 999);

//     const upcomingInterviews = await Interview.find({
//       scheduled_date: { $gte: tomorrow, $lte: nextDay },
//     }).populate("recruiterId", "name email");

//     for (const interview of upcomingInterviews) {
//       await Notification.create({
//         userId: interview.recruiterId._id,
//         message: `Reminder: You have an interview titled "${interview.title}" scheduled for tomorrow.`,
//         status: "unread",
//       });

//       for (const candidateId of interview.candidates) {
//         await Notification.create({
//           userId: candidateId,
//           message: `Reminder: You have an interview titled "${interview.title}" scheduled for tomorrow.`,
//           status: "unread",
//         });
//       }
//     }

//     console.log(
//       `✅ Notifications sent for ${upcomingInterviews.length} upcoming interviews.`
//     );
//   } catch (error) {
//     console.error("❌ Error checking upcoming interviews:", error.message);
//   }
// };

// // setInterval(checkUpcomingInterviews, 24 * 60 * 60 * 1000);



// ✅ Get notification details
router.get("/:id", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.json({ notification });
  } catch (error) {
    console.error("❌ Error fetching notification details:", error.message);
    res.status(500).json({ message: "Error fetching notification details" });
  }
});



// ✅ Delete notification
router.post("/:id/delete", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Extract interview title from notification message
    const interviewTitleMatch = notification.message.match(/"([^"]+)"/);
    if (!interviewTitleMatch) {
      return res.status(400).json({ message: "Invalid notification format" });
    }

    const interviewTitle = interviewTitleMatch[1];

    // Find the corresponding interview by title
    const interview = await Interview.findOne({ title: interviewTitle });
    if (!interview) {
      // ✅ Allow deleting notification if interview is not found
      await Notification.findByIdAndDelete(req.params.id);
      return res.json({ message: "Notification deleted successfully" });
    }

    // Check if interview is within 24 hours
    const now = new Date();
    const interviewDate = new Date(interview.scheduled_date);
    const hoursDifference = (interviewDate - now) / (1000 * 60 * 60);

    if (hoursDifference <= 24) {
      return res.status(403).json({ message: "Cannot delete notifications for interviews happening within 24 hours." });
    }

    // Delete the notification if the interview is not within 24 hours
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error.message);
    res.status(500).json({ message: "Error deleting notification" });
  }
});

module.exports = router;
