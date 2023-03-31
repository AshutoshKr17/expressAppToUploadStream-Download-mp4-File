const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const fs = require("fs");
const path = require("path");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.use(express.static(path.join(__dirname, "uploads")));

app.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const video = req.files.video;
  const uploadPath = path.join(__dirname, "uploads", video.name);

  video.mv(uploadPath, (err) => {
    if (err) {
      console.error(`Error uploading file: ${err.message}`);
      res.status(500).send(`Could not upload file: ${err.message}`);
    } else {
      console.log(`File uploaded: ${video.name}`);
      res.send("File uploaded successfully!");
    }
  });
});

app.get("/stream/:video", (req, res) => {
  const videoPath = path.join(__dirname, "uploads", req.params.video);
  const videoStat = fs.statSync(videoPath);
  const fileSize = videoStat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.get("/download/:video", (req, res) => {
  const videoPath = path.join(__dirname, "uploads", req.params.video);
  res.download(videoPath, (err) => {
    if (err) {
      console.error(`Error downloading file: ${err.message}`);
      res.status(404).send(`Could not download file: ${err.message}`);
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
