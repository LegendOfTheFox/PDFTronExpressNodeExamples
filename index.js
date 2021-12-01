const { PDFNet } = require("@pdftron/pdfnet-node");
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        data: "Hello from the server"
    });
});

const request = require('request');

app.get("/htmlToPDF", async (req, res) => {
    const outputPath = path.resolve(__dirname, "./files/html2pdfExample3.pdf");
    const testURL = "https://www.google.ca/";
    let result = ""
    
    const pullEndpoint = () => {
        request(testURL, (err, res, body) => {
            result = body;
            
        if (err) { return console.log(err); }
        
        PDFNet.runWithCleanup(main, 'demo:1635863083431:788f199603000000002f844f5ddc4e2c3945c80ad809a07f0d574b0d52').then(function() {
            PDFNet.shutdown();
            console.log("Process Complete");
        }).catch(err => console.log(err));

        });
    }

    const main = async () => {
        await PDFNet.HTML2PDF.setModulePath('./additional_libs/');
        
        const html2pdf = await PDFNet.HTML2PDF.create();
        const doc = await PDFNet.PDFDoc.create();
        
        await html2pdf.insertFromHtmlString(result);

        //let options = await PDFNet.HTML2PDF.WebPageSettings.create();
        //;await html2pdf.insertFromUrl2(testURL, options);
        //await html2pdf.insertFromHtmlString("<h1>Hello World</h1>");
        // await html2pdf.insertFromUrl(testURL);

        if (await html2pdf.convert(doc)) {
            doc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
        } else {
            console.log('Conversion failed.');
            let log = await html2pdf.getLog();
            console.log(log);
            let errorCode = await html2pdf.getHttpErrorCode();
            console.log(errorCode);
        }
    }

    pullEndpoint();

});

app.get("/htmlToPDF2", async (req, res) => {
    const outputPath = path.resolve(__dirname, "./files/html2pdfExample4.pdf");
    const testURL = "https://www.google.ca/";
    
    const main = async () => {
        
        await PDFNet.HTML2PDF.setModulePath('./additional_libs/');
        const html2pdf = await PDFNet.HTML2PDF.create();
        const doc = await PDFNet.PDFDoc.create();
        
        await html2pdf.insertFromHtmlString(`<div>Hello World!</div>`);

        if (await html2pdf.convert(doc)) {
            doc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
        } else {
            console.log('Conversion failed.');
            let log = await html2pdf.getLog();
            console.log(log);
            let errorCode = await html2pdf.getHttpErrorCode();
            console.log(errorCode);
        }
    }

    PDFNet.runWithCleanup(main).then(function() {
            PDFNet.shutdown();
            console.log("Process Complete");
        }).catch(err => console.log(err));
});

app.listen(4000, () => {
    console.log("App is running");
});