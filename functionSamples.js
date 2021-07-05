const { PDFNet } = require("@pdftron/pdfnet-node");

exportToXFDF = async () => {
    const doc = await PDFNet.PDFDoc.createFromURL(filename);
    // Extract annotations to FDF.
    // Optionally use e_both to extract both forms and annotations
    const doc_fields = await doc.fdfExtract(PDFNet.PDFDoc.ExtractFlag.e_annots_only); //PDFNet.PDFDoc.ExtractFlag.e_forms_only

    // Export annotations from FDF to XFDF.
    const xfdf_data = await doc_fields.saveAsXFDFAsString();

    //optionally save the blob to a file or upload to a server
    const blob = new Blob([xfdf_data], { type: 'application/xml' });
}