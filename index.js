const express= require("express");
const app= express();
const http = require("http").createServer(app)

const mongodb = require("mongodb")
const mongoClient = mongodb.MongoClient
const ObjectId= mongodb.ObjectId

const fileSystem= require("fs")
const expressFormdiable = require("express-formidable");
const { type } = require("os");
const { error } = require("console");
app.use(expressFormdiable())

app.set("view engine","ejs")

http.listen(process.env.PORT || 3000,async function(){
    console.log("server started");

    const client= await mongoClient.connect("mongodb+srv://root:root@swissbakecrud.4rwkmwc.mongodb.net/upload?retryWrites=true&w=majority&appName=swissbakecrud",{
        useUnifiedTopology:true
    })
    const db = client.db("mongodb_gridfs")
    console.log("Databse Connected")

    const bucket = new mongodb.GridFSBucket(db)

    app.post("/upload",function(request, result){

        const file = request.files.file

        const filePath = (new Date().getTime())+"_"+file.name

        fileSystem.createReadStream(file.path)
        .pipe(bucket.openUploadStream(filePath,{
            chunkSizeBytes: 1048576,
            metadata: {
                name:file.name,
                size:file.size,
                type:file.type
            }
        }))
        .on("finish",function(){
            result.redirect("/")
        })




    })

    app.get("/image/:filename",async function(request,result){
        const files = await bucket
        .find({
            filename:request.params.filename
        })
        .toArray()

    if(!files || files.length===0){
        return result.status(404).json({
            error:"files does not exist"
        })
    }
    bucket.openDownloadStreamByName(request.params.filename).pipe(result)
    })

    app.get("/", async function(request, result){

        const files = await bucket.find({

        }).sort({
            uploadDate: -1
        }).toArray()

        result.render("index",{
            files:files
        })
    })


})