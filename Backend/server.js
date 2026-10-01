const express = require("express");
const cors = require("cors");
const app = express();
// Middleware
app.use(cors());
// Allows frontend to access backend
app.use(express.json());
// Test API endpoint
app.get("/api/test", (req, res) => {
const htmlContent = ` <div style="color: blue; font-family: Arial;">
<h1>Welcome to The LEGO Planner!</h1>
<p>This HTML is served from the backend.</p>
<p> No seriously there is nothing here yet.</p>
</div>`;
res.send(htmlContent);
});
//start the server and listen on the Specified port
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));