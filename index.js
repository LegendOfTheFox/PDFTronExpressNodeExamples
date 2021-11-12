const { PDFNet } = require("@pdftron/pdfnet-node");
const express = require("express");
const path = require("path");
const fs = require("fs");
const { stringify } = require("querystring");


const app = express();

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        data: "Hello from the server"
    });
});

app.get("/htmlToPDF", (req, res) => {
    const outputPath = path.resolve(__dirname, "./files/html2pdfExample.pdf");
    const testURL = "https://www.google.ca/"

    const main = async () => {
        await PDFNet.HTML2PDF.setModulePath('./additional_libs/');
        
        const html2pdf = await PDFNet.HTML2PDF.create();
        const doc = await PDFNet.PDFDoc.create();

        html2pdf.insertFromUrl(testURL);

        if (await html2pdf.convert(doc)) {
          doc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
        } else {
          console.log('Conversion failed.');
        }
    }

    
    
    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));

});

app.get("/pdfToTiff", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/arabicSample.pdf");
    const outputPath = path.resolve(__dirname, "./files/arabicSampleConverted.tiff");

    const main = async () => {
        
        const tiff_options = new PDFNet.Convert.TiffOutputOptions();
        tiff_options.setDPI(200);
        tiff_options.setDither(true);
        tiff_options.setMono(true);
        
        await PDFNet.Convert.fileToTiff(inputPath, outputPath, tiff_options);
        console.log('Saved tiff');
    }

    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));
});


app.get("/pdfTemplate", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/CarAdFormat2.pdf");
    //const outputPath = path.resolve(__dirname, "./files/arabicSampleConverted.tiff");

    const main = async () => {
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
        const reader = await PDFNet.ElementReader.create();

        const test = await doc.getTrailer();
        console.log(test);

        let itr2 = await test.getDictIterator();
        while (itr2.hasNext()) {
            let key = await itr2.key();
            let value = await itr2.value();

            console.log(`key: ${key}, value: ${value}`);
            console.log(key);
            console.log(value);
            // ...
            itr2.Next()
        }
        //let test = await trailer.findObj

        // Read page content on every page in the document
        const itr = await doc.getPageIterator();

        for (itr; await itr.hasNext(); itr.next())
        {
        // Read the page
        const page = await itr.current();
        reader.beginOnPage(page);
        await ProcessElements(reader);
        reader.end();
        }
        

    }

    async function ProcessElements(reader)
    {
        // Traverse the page display list
        for (let element = await reader.next(); element !== null; element = await reader.next()) {
            const elementType = await element.getType();
            switch (elementType)
            {
                case PDFNet.Element.Type.e_path:
                {
                    if (element.isClippingPath())
                    {}
                    // ...
                    break;
                }
                case PDFNet.Element.Type.e_text:
                {
                    const text_mtx = await element.getType();

                    console.log(text_mtx);
                    // ...
                    break;
                }
                case PDFNet.Element.Type.e_form:
                {
                    reader.formBegin();
                    ProcessElements(reader);
                    reader.end();
                    break;
                }
            }
        }
    }

    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));
});


app.get("/tiffToPdf", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/arabicSampleConverted.tiff");
    const outputPath = path.resolve(__dirname, "./files/arabicSampleConverted.pdf");

    const main = async () => {
        const pdfdoc = await PDFNet.PDFDoc.create();
        await pdfdoc.initSecurityHandler();

        await PDFNet.Convert.toPdf(pdfdoc, inputPath);
        await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }

    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));
});

app.get("/signatureTest", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/signsample.pdf");
    const outputPath = path.resolve(__dirname, "./files/signsampleSigned.pdf");

    const main = async () => {
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
        const cert_file_path = "/files/cert.p12";
        const approvalFieldName = "test1";
        const appearance_img_path = "/files/fox.png";

        doc.lock();

        const sigHandlerId = await doc.addStdSignatureHandlerFromURL(cert_file_path, 'test');

        const foundApprovalField = await doc.getField(approvalFieldName);
        const approvalSigField = await PDFNet.DigitalSignatureField.createFromField(foundApprovalField);

        await approvalSigField.setLocation("Vancouver, BC");
        await approvalSigField.setReason("Document approval.");
        await approvalSigField.setContactInfo("www.pdftron.com");

        const img = await PDFNet.Image.createFromURL(doc, appearance_img_path);
        const approvalSignatureWidget = await PDFNet.SignatureWidget.createWithDigitalSignatureField(doc, await PDFNet.Rect.init(0, 100, 200, 150), approvalSigField);
        await approvalSignatureWidget.createSignatureAppearance(img);
        const page1 = await doc.getPage(1);
        page1.annotPushBack(approvalSignatureWidget);

        // Prepare the signature and signature handler for signing.
        await approvalSigField.signOnNextSaveWithCustomHandler(sigHandlerId);

        // The actual approval signing will be done during the save operation.
        await doc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }

    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));
});


app.get("/scalePage", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/10mbsample.docx");
    const outputPath = path.resolve(__dirname, "./files/10mbsampleScaled.pdf");

    const main = async () => {
        // open document from the filesystem
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);

        const pageIterator = await doc.getPageIterator();

        for(pageIterator; await pageIterator.hasNext(); pageIterator.next())
        {
            const page = await pageIterator.current();
            //page.scale()
        }
    }


});

app.get("/convertWordToPDFwithFontFile", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/agilelaw/ADS02.docx");
    const outputPath = path.resolve(__dirname, "./files/agilelaw/ADSNewConversionTest.pdf");

    const main = async () => {
        await PDFNet.addResourceSearchPath("./files/agilelaw/fonts");

        let data = {
            "setLayoutResourcesPluginPath": "./files/agilelaw/fonts"
        }
        const options = await PDFNet.Convert.OfficeToPDFOptions(JSON.stringify(data));
        //options.setLayoutResourcesPluginPath("./files/agilelaw/fonts");

        const pdfdoc = await PDFNet.Convert.officeToPdfWithPath(inputPath, options);

        //const pdfdoc = await PDFNet.PDFDoc.create();
        //await PDFNet.Convert.toPdf(pdfdoc, "./files/agilelaw/ADS.docx");

        // save the result
        await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);

        console.log("Conversion Complete");
    }

    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));
});

app.get("/convertWordToPDF", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/conversiontest.docx");
    const outputPath = path.resolve(__dirname, "./files/conversionTestConverted.pdf");
    let generatedPDF;
    const main = async () => {
        let file = fs.readFileSync(inputPath);
        const docFilter = await PDFNet.Filter.createFromMemory(file);
        const doc = await PDFNet.Convert.officeToPdfWithFilter(docFilter, new PDFNet.Obj('0'));
        //await doc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);

        generatedPDF = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_remove_unused);
    }

    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        res.setHeader("ContentType", "application/pdf");
        res.end(generatedPDF);
        console.log("Process Complete");
    }).catch(err => console.log(err));
});

//Shows Template Generation Using an Excel Document as the template
app.get("/templateGenerationExcel", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/excelBasicTemplate.xlsx");
    const outputPath = path.resolve(__dirname, "./files/excelConverted.pdf");

    const main = async () => {
        let data = {
            "test": "1st Test",
            "test2": "2nd Test",
            "test3": "Final Test"
        }

        const options = new PDFNet.Convert.OfficeToPDFOptions();
        options.setTemplateParamsJson(JSON.stringify(data));

        // perform the conversion with the template replacement data
        const doc = await PDFNet.Convert.officeToPdfWithPath(inputPath, options);

        await doc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    };

    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));
});

app.get("/ocrConversion", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/24144OCRTest.pdf");
    //const inputPath = path.join(__dirname, "./files/german_kids_song.pdf");
    const outputPath = path.resolve(__dirname, "./files/24144OCRTestOCRConverted.pdf");
    //const outputPath = path.resolve(__dirname, "./files/german_kids_songOCRConverted.pdf");
    const ocrPath = path.resolve(__dirname, "./additional_libs/OCRModule.exe");

    const main = async () => {
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);


        PDFNet.addResourceSearchPath(ocrPath);

        // Set English as the language of choice
        const ocrOpts = new PDFNet.OCRModule.OCROptions();
        ocrOpts.addLang("eng");
        ocrOpts.addDPI(72);

        // Run OCR on the PDF with options
        try{
            await PDFNet.OCRModule.processPDF(doc, ocrOpts);
        }catch(e){
            console.log(e);
        }
        

        //const opts = new PDFNet.PDFDoc.ViewerOptimizedOptions();

        // A number from 0 (include all thumbnails) to 100
        // (include only the first thumbnail). The default value is 50.
        //opts.setThumbnailRenderingThreshold(0);

        // The maximum allowed length for the thumbnail's height/width.
        // The default thumbnail size is 1024.
        //opts.setThumbnailSize(512);


        // Optimize pdf
        //await doc.saveViewerOptimized(outputPath, opts);
        doc.save(outputPath, 0);
    };
    
    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    }).catch(err => console.log(err));

});


app.get("/convertViewerOptimized", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/10mbsample.pdf");
    const outputPath = path.resolve(__dirname, "./files/10mbsampleOptimized.pdf");

    const main = async () => {
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);

        const opts = new PDFNet.PDFDoc.ViewerOptimizedOptions();

        // A number from 0 (include all thumbnails) to 100
        // (include only the first thumbnail). The default value is 50.
        opts.setThumbnailRenderingThreshold(0);

        // The maximum allowed length for the thumbnail's height/width.
        // The default thumbnail size is 1024.
        opts.setThumbnailSize(512);


        // Optimize pdf
        await doc.saveViewerOptimized(outputPath, opts);
    };
    
    PDFNet.runWithCleanup(main).then(function() {
        PDFNet.shutdown();
        console.log("Process Complete");
    });
});

/*
Sample endpoint showcases how values can be subbed out of a template PDF and be replaced with values of your choice
Values to replaced should be within []. Examples on the pdf include [QuoteNumber] & [CustomerName]
*/
app.get("/generateInvoice", (req, res) => {
    const inputPath = path.resolve(__dirname, "./files/sampleword.pdf");
    const outputPath = path.resolve(__dirname, "./files/sampleword_replaced.pdf");

    const replaceText = async () => {
        // Build the PDF
        const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
        // Lockdown the file
        await pdfdoc.initSecurityHandler();
        // Create replacer object
        const replacer = await PDFNet.ContentReplacer.create();
        // Grab the page you want to perform the replace on
        const page = await pdfdoc.getPage(1);

        // Sub out the values
        await replacer.addString("QuoteNumber", "6452");
        await replacer.addString("CustomerName", "Bryan Fox");
        await replacer.addString("AddressLine1", "100 Front St.");
        await replacer.addString("AddressLine2", "Toronto, Ont");
        await replacer.addString("Item1", "Apples");
        await replacer.addString("Item1Qnt", "28");
        await replacer.addString("Item1Total", "28");
        await replacer.addString("Total", "28");
        await replacer.addString("ExpiryDate", new Date(Date.now()).toLocaleDateString());

        // Process all of the changes
        await replacer.process(page);

        // Save the changes, PDF is being linearized for speed and allows the document to be chunked before viewing
        pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }

    PDFNet.runWithCleanup(replaceText).then(() => {
        fs.readFile(outputPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(err);
            } else {
                res.setHeader("ContentType", "application/pdf");
                res.end(data);
            }
        })
    }).catch(err => {
        res.statusCode = 500;
        res.end(err);
    });
});

app.get("/template-generation", (req,res) => {
    const json_data_string = {
        "legal_heading":"End-User Agreement",
        "indemnification_clause":"Sed ut unde omnis iste natus error sit volup tatem dolo remque laud antium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi archi tecto beatae vitae dicta sunt.",
        "escrow_clause":"Lorem ipsum dolor sit amet, consec  tetuer adipi scing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque pena tibus et magnis dis partu rient montes, nascetur ridiculus mus. Donec quam felis, ultri cies nec, pellent esque faucibus. Nullam quis ante. Etiam sit amet orci eget eros fauc ibus tinc idunt. Duis leo. Sed frin gilla mauris sit amet nibh. Donec sodales sag ittis magna. Sed conse quat, leo eget",
        "arbitration_clause":"pretium quis, sem. Nulla conse quat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venen atis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tinc",
        //"image_url": {image_url: "./files/fox.jpg", width: 500, height: 500}
        "image_url": {image_url: "https://image.shutterstock.com/image-photo/red-fox-vulpes-sitting-attention-260nw-392638390.jpg", 'width': 500, 'height': 500}
    };

    const inputPath = path.resolve(__dirname, "./files/templatetest.docx");

    const main = async() => {
    try {
        // create an options object and add your template
        // replacement values to it. If this option is not
        // set, the document will convert as if it is a normal
        // office documents, with no template generation.
        const options = new PDFNet.Convert.OfficeToPDFOptions();
        await options.setTemplateParamsJson(JSON.stringify(json_data_string));

        // perform the conversion with the template replacement data
        const pdfdoc = await PDFNet.Convert.officeToPdfWithPath(inputPath, options);

        await pdfdoc.save('template-1.pdf', 0);

        console.log('Done.');
    } catch (err) {
        console.log(err);
    }
};

PDFNet.runWithCleanup(main)
    .catch(function (error) {
        console.log("Error: " + JSON.stringify(error));
    })
    .then(function () {
        PDFNet.shutdown();
    });
})

app.get("/toggle-ocg", (req, res) => {
    let filename = "ocgsample.pdf";

    const inputPath = path.resolve(__dirname, `./files/${filename}`);
    const outputPath = path.resolve(__dirname, `./files/${filename}_toggled.pdf`);

    const toggleLayers = async () => {
        const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);

        // get the config from the document
        let ocgConfig = await pdfdoc.getOCGConfig();
        // Get the Array containing the OCGS
        let ocgs = await pdfdoc.getOCGs();

        if (ocgs !== null) {
            let i;
            const sz = await ocgs.size();
            for (i = 0; i < sz; ++i) {
                const ocg = await PDFNet.OCG.createFromObj(await ocgs.getAt(i));
                await ocg.setInitialState(ocgConfig, false);
            }
        }

        await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }


    PDFNet.runWithCleanup(toggleLayers).then(() => {
        fs.readFile(outputPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(err);
            } else {
                res.setHeader("ContentType", "application/pdf");
                res.end(data);
            }
        })
    }).catch(err => {
        res.statusCode = 500;
        res.end(err);
    });
})

/*
Sample shows how to add a watermark to your document. Watermarks can either be text or images
*/
app.get("/watermark", (req, res) => {
    const { filename, watermark } = req.query;
    const inputPath = path.resolve(__dirname, `./files/${filename}.pdf`);
    const outputPath = path.resolve(__dirname, `./files/${filename}_watermarked.pdf`);

    const watermarkPDF = async () => {
        const pdfdoc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
        pdfdoc.initSecurityHandler();

        // Create the stample object and define where the stamping will occur by the bounds of the document and scaling
        const stamper = await PDFNet.Stamper.create(PDFNet.Stamper.SizeType.e_relative_scale, 0.5, 0.5);

        // Set the stamplers alignment
        stamper.setAlignment(PDFNet.Stamper.HorizontalAlignment.e_horizontal_center,
            PDFNet.Stamper.VerticalAlignment.e_vertical_center);

        // Set the color of the Text used in this example, RGB value
        const redColorPt = await PDFNet.ColorPt.init(1, 0, 0);
        stamper.setFontColor(redColorPt);
        // Set the range of pages that will have the watermark applied to them
        const pgSet = await PDFNet.PageSet.createRange(1, await pdfdoc.getPageCount());
        // Perform the watermarking
        await stamper.stampText(pdfdoc, watermark, pgSet);

        await pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }

    PDFNet.runWithCleanup(watermarkPDF).then(() => {
        fs.readFile(outputPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(err);
            } else {
                res.setHeader("ContentType", "application/pdf");
                res.end(data);
            }
        })
    }).catch(err => {
        res.statusCode = 500;
        res.end(err);
    });
})

/*
    This example converts a MS Excel file to a pdf
    todo: still having some issues with this one
*/
app.get("/convertFromExcel", (req, res) => {
    const { filename } = req.query;

    const inputPath = path.resolve(__dirname, `./files/${filename}`);
    const outputPath = path.resolve(__dirname, `./files/${filename}officeToPdfVersion.pdf`);
    const outputPath2 = path.resolve(__dirname, `./files/${filename}toPDFVersion.pdf`);

    const convertToPDF = async () => {
        // empty PDF to hold the file
        //const pdfdoc = await PDFNet.PDFDoc.create();
        //await pdfdoc.initSecurityHandler();
        // perform the actual conversion
        //await PDFNet.Convert.toPdf(pdfdoc, inputPath);
        const options = await PDFNet.Convert.createOfficeToPDFOptions();
        options.setExcelDefaultCellBorderWidth(0.001);
        let results = await PDFNet.Convert.officeToPdfWithPath(inputPath, options).catch(err => console.log(err));
        PDFNet.Convert.office2PDF

        results.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
        //pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }

    PDFNet.runWithCleanup(convertToPDF).then(() => {

        fs.readFile(outputPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(err);
            } else {
                res.setHeader("ContentType", "application/pdf");
                res.end(data);
            }
        })
    }).catch(err => {
        res.statusCode = 500;
        res.end(err);
    });
});

/*
    This example converts a .docx file to a pdf
*/
app.get("/convertFromOffice", (req, res) => {
    const { filename } = req.query;

    const inputPath = path.resolve(__dirname, `./files/${filename}`);
    const outputPath = path.resolve(__dirname, `./files/${filename}.pdf`);

    const convertToPDF = async () => {
        // empty PDF to hold the file
        const pdfdoc = await PDFNet.PDFDoc.create();
        await pdfdoc.initSecurityHandler();
        // perform the actual conversion
        await PDFNet.Convert.toPdf(pdfdoc, inputPath);
        pdfdoc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }

    PDFNet.runWithCleanup(convertToPDF).then(() => {
        fs.readFile(outputPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(err);
            } else {
                res.setHeader("ContentType", "application/pdf");
                res.end(data);
            }
        })
    }).catch(err => {
        res.statusCode = 500;
        res.end(err);
    });
});

/*
    This sample performs the generation of a graphical thumbnail of a PDF
*/
app.get("/thumbnail", (req, res) => {
    const { filename } = req.query;

    const inputPath = path.resolve(__dirname, `./files/${filename}`);
    const outputPath = path.resolve(__dirname, `./files/${filename}.png`);

    const getThumbFromPDF = async () => {
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
        await doc.initSecurityHandler();

        // create the Drawing object, defining a DPI value for the final image
        const pdfDraw = await PDFNet.PDFDraw.create(92);
        // grab the page you want to convert into the thumbnail
        const currPage = await doc.getPage(1);
        // export the actual page, defining the output type 
        await pdfDraw.export(currPage, outputPath, 'PNG');
    }

    PDFNet.runWithCleanup(getThumbFromPDF).then(() => {
        fs.readFile(outputPath, (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.end(err);
            } else {
                res.setHeader("ContentType", "image/png");
                res.end(data);
            }
        })
    }).catch(err => {
        res.statusCode = 500;
        res.end(err);
    });
});

/*
This sample extracts text from a page within a PDF and returns the raw String values
*/
app.get("/textExtract", (req, res) => {
    const { filename, pageNumber } = req.query;

    const inputPath = path.resolve(__dirname, `./files/${filename}`);

    const extractText = async () => {
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath);
        await doc.initSecurityHandler();
        // Define the page # to extract the text from
        const page = await doc.getPage(Number(pageNumber));
        // Create the Text Extractor object
        const txt = await PDFNet.TextExtractor.create();
        // Define the area that the extraction will be executed on, this can allow you to clip out certain areas of the document
        const rect = new PDFNet.Rect(0, 0, 612, 794);
        // read in the data based on the page selected and the defined bounding coordinates
        txt.begin(page, rect);
        // perform the actual text extractions
        const text = await txt.getAsText();

        res.status(200).json({
            status: "success",
            data: text
        })
    }

    PDFNet.runWithCleanup(extractText).then(() => {
    }).catch(err => {
        res.statusCode = 500;
        res.end(err);
    });
});

app.listen(4000, () => {
    console.log("App is running");
});