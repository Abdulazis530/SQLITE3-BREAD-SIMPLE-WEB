const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const path = require('path')
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.join(__dirname, "bread.db"))
const app = express()

app.use("/", express.static(path.join(__dirname, "public")))
app.set('views', path.join(__dirname, "views"))
app.set('view engine', 'ejs')


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const condition = []
const port = 3000

app.get("/", (req, res) => {   
    const limit=5
    if (req.query.search === "clicked" ||req.query.pageBrowse) {
        let currentPage= req.query.pageBrowse || 1   
        let page ="pageBrowse"

        if (req.query.checkboxId === "on" && req.query.id.length !== 0) condition.push(`bread_id = ${Number(req.query.id)}`)
        if (req.query.checkboxString === "on" && req.query.string.length !== 0) condition.push(`string LIKE "${req.query.string}"`)
        if (req.query.checkboxInteger === "on" && req.query.integer.length !== 0) condition.push(`intData = ${Number(req.query.integer)}`)
        if (req.query.checkboxFloat === "on" && req.query.float.length !== 0) condition.push(`floatType = ${Number(req.query.float)}`)
        if (req.query.checkboxDate === "on" && req.query.startdate.length !== 0 && req.query.enddate !== 0) condition.push(`(tanggal BETWEEN "${req.query.startdate}" AND "${req.query.enddate}")`)
        if (req.query.checkboxBoolean === "on" && req.query.bool !== "Choose...") condition.push(`bool = "${req.query.bool}"`)

        const conditions = condition.join(" OR ")
       
        db.serialize(function () {
            let sql = `SELECT COUNT(*) as total  FROM bread WHERE ${conditions};`
            
            db.get(sql, (err, data) => {

                if (err) throw err
                if (data) {
                    let query = `SELECT * FROM bread WHERE ${conditions} LIMIT ${limit} OFFSET ${(currentPage*limit)-limit};` 
                    db.all(query, (err, rows) => {

                        if (err) throw err
                        if (rows) {
                         
                           
                            let totalPage= Math.ceil(Number(data.total/limit))
                       
                            
                            res.render('index', { rows,totalPage,currentPage,nameOfPage:page})
                        } else {
                            console.log("tidak ada hasil")
                        }
                    })
                } 
            })
        })
    } else {
        let currentPage= req.query.page || 1
        let page ="page"
        db.serialize(function () {
            let sql = `SELECT COUNT(*) as total FROM bread;`

            db.get(sql, (err, data) => {

                if (err) reject(err)
                if (data) {

                    let query = `SELECT * FROM bread LIMIT ${limit} OFFSET ${(currentPage*limit)-limit};` 
                    db.all(query, (err, rows) => {

                        if (err) throw err
                        if (rows) {
                            
                            let totalPage= Math.ceil(data.total/limit)
                            res.render('index', { rows,totalPage,currentPage,nameOfPage:page})
                        } else {
                            console.log("tidak ada hasil")
                        }
                    })


                }
            })
        })



    }


})

app.post("/", (req, res) => {

    for (const key in req.body) {
        if (key === "delete") {

            db.serialize(function () {
                let sql = "DELETE FROM bread WHERE bread_id=?"
                db.run(sql, [req.body.delete], (err) => {
                    if (err) {
                        throw err
                    }
                    else {
        
                        res.redirect("/")
                    }

                })
            })
        }

    }
})

app.get("/edit/:id", (req, res) => {
    const editId = req.params.id

    db.serialize(function () {
        let sql = "SELECT*FROM bread WHERE bread_id=?"
        db.get(sql, [editId], (err, rows) => {
            if (err) {
                throw err
            }
            else if (rows) {
                const { bread_id, string, intData, floatType, tanggal, bool } = rows
                res.render('edit', { bread_id, string, intData, floatType, tanggal, bool })
            }

        })
    })



})


app.post("/edit", (req, res) => {

    const { bread_id, string, intData, floatType, tanggal, bool } = req.body

    db.serialize(function () {
        let sql = `UPDATE bread SET string ="${string}",intData=${intData},floatType=${floatType},tanggal="${tanggal}",bool="${bool}" WHERE bread_id=${bread_id}`

        db.run(sql, (err) => {
            if (err) throw err;
        });
    })

    res.redirect("/")
})

app.get("/add/", (req, res) => {
    res.render('add')

})

app.post("/add", (req, res) => {
    
    const { string, intData, floatType, tanggal, bool } = req.body
    db.serialize(function () {
        let sql = `INSERT INTO bread (string, intData, floatType, tanggal,bool) values ("${string}",${intData},${floatType},"${tanggal}","${bool}")`
        db.run(sql, (err) => {
            if (err) throw err;
        });
    })
    res.redirect("/")

})



app.listen(port, () => console.log(`Server is runing on port ${port}`))

