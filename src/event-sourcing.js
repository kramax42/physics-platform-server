const express = require('express');
const cors = require('cors');
const app = express();

const lab1Router = require("./routes/lab1.route");
const lab2Router = require("./routes/lab2.route");

const PORT = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


app.use('/lab1', lab1Router);
app.use('/lab2', lab2Router);

app.get('/test', (req, res) => {
    res.send(`<h1>Test</h1>`);
})




app.listen(PORT, () => console.log(`Server started on port ${PORT}`))