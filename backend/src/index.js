const express = require("express")
const app = express()

const PORT_NO = process.env.PORT_NO | 5000

app.listen(PORT_NO, () =>{
    console.log(
        `Server is listening on port no ${PORT_NO}`
    )
})