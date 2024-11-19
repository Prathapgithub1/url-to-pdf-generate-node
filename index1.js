const express = require('express');
const cheerio = require('cheerio')
const fs = require('fs');
const axios = require("axios");
const path = require('path');
const app = express();
const puppeteer = require('puppeteer');
const PORT = 3000;

let browser;
async function startBrowerEngine() {
    browser = await puppeteer.launch(
        {
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: false, // Run in non-headless mode for debugging
            devtools: true,  // Open devtools to see logs and network activity
            args: ['--no-sandbox', '--disable-setuid-sandbox']

        }
    );
};
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//gen pdf
async function genPdf(gRptUrl, gRptPath, type) {
    try {
        let __page = await browser.newPage();
        process.setMaxListeners(Infinity);
        const response = await __page.goto(gRptUrl, {
            waitUntil: 'networkidle2', timeout: 120000
        });
        if (!response.ok()) {
            throw new Error(`HTTP error! status: ${response.status()}`);
        }
        // await __page.waitForTimeout(2000);
        await delay(2000);

        let _bufValue = "";

        let _path = gRptPath
        _bufValue = await __page.pdf({
            path: _path,
            format: 'A4',
            printBackground: true,
        });
        const pages = await browser.pages();
        for (const page of pages) { await page.close(); }
        __page = null;
        try {
            await browser.close();
            return { status: 'success', path: _path };

        }
        catch (e) {
            console.log("Error whie closing browsing", e);
        }
        // return _bufValue;
    }
    catch (ex) {
        try {
            const pages = await browser.pages();
            for (const page of pages) { await page.close(); }
        }
        catch (err) {

        }

        try {
            await browser.close();
            console.log("browser closed");
        }
        catch (e) {
            console.log("Error whie closing browsing", e);
        }
        return { status: 'error', error: ex.message };

    }
}
//working api
app.post('/pdfsAndUrls', async (req, res) => {
    try {
        let totalResponseData = []
        let hrefArray = [];
        let pdfUrlsArray = [];
        req.body = [{
            DD_SUBSTANCE_CD: "SS0000760 + SS0000394",
            SECTION_NAME: "References",
            SECTION_TYPE: "hcp",
            drug_content: `
                  <ol>
                    <li><a href="http://ncithesaurus.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_The saurus&version=23.12d&ns=ncit&code=C614&key=n1471404283&b=1&n=null" target="_blank">http://ncithesaurus.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_The saurus&version=23.12d&ns=ncit&code=C614&key=n1471404283&b=1&n=null</a></li>
                    <li><a href="http://ncithesaurus.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_The saurus&version=23.12d&ns=ncit&code=C28985&key=119004219&b=1&n=null" target="_blank">http://ncithesaurus.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_The saurus&version=23.12d&ns=ncit&code=C28985&key=119004219&b=1&n=null</a></li>
                    <li><a href="http://www.whocc.no/atc_ddd_index/?code=N01BB52" target="_blank">http://www.whocc.no/atc_ddd_index/?code=N01BB52</a></li>
                    <li><a href="http://atcddd.fhi.no/atc_ddd_index/?code=M01AB55" target="_blank">http://atcddd.fhi.no/atc_ddd_index/?code=M01AB55</a></li>
                    <li><a href="http://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=f18c3240-61e7-66cc-e053-2a95a90a1656&type=display" target="_blank">http://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=f18c3240-61e7-66cc-e053-2a95a90a1656&type=display</a></li>
                    <li><a href="http://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=f821869d-f5dd-0f a9-e053-6394a90a8e1a&type=display" target="_blank">http://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=f821869d-f5dd-0f a9-e053-6394a90a8e1a&type=display</a></li>
                    <li><a href="http://pubchem.ncbi.nlm.nih.gov/compound/3676" target="_blank">http://pubchem.ncbi.nlm.nih.gov/compound/3676</a></li>
                    <li><a href="http://pubchem.ncbi.nlm.nih.gov/compound/6314" target="_blank">http://pubchem.ncbi.nlm.nih.gov/compound/6314</a></li>
                    <li><a href="http://pubchem.ncbi.nlm.nih.gov/compound/3033" target="_blank">http://pubchem.ncbi.nlm.nih.gov/compound/3033</a></li>
                    <li><a href="http://pubchem.ncbi.nlm.nih.gov/compound/5018304" target="_blank">http://pubchem.ncbi.nlm.nih.gov/compound/5018304</a></li>
                  </ol>
                `,
            drug_monography_Code: "SECT10364",
            drug_section_id: "642ea9b76b3fd6884b63e334",
            interacction_drug_content: [],
            recStatus: true,
            revNo: 3,
            role_id: "651eb5b1cc62a01264452c6f",
            section_comment: [],
            session_id: "44520",
            user_id: "64d9fc391494ca2eed7e8d3f",
            __v: 0,
            _id: "652910ae0d5eb8f7e83dad73"
        }];
        let _htmlTags = req.body[0].drug_content;
        let _substanceCD = req.body[0].DD_SUBSTANCE_CD;
        const $ = cheerio.load(_htmlTags);
        const directoryPath = path.join(__dirname, 'convertedPdfUrls');
        const files = fs.readdirSync(directoryPath);
        if (files.includes(_substanceCD)) {
            console.log("Matched file");
        } else {
            $('li').each((index, liElement) => {
                // Find the first <a> tag within the current <li> element
                const firstATag = $(liElement).find('a').first();
                // Check if such <a> tag exists and has href attribute
                if (firstATag.length > 0 && firstATag.attr('href')) {
                    let href = firstATag.attr('href');
                    //let href = "http://6.https://www.ebs.tga.gov.au/ebs/picmi/picmirepository.nsf/pdf?OpenAgent&id=CP-2017-PI-02019-1";
                    // Check if the href does not end with '.pdf'
                    href = href.trim()
                    let protocols = href.match(/\bhttps?:\/\//g);
                    let result = (protocols && protocols.length === 2) ? href.substring(href.indexOf(protocols[1])) : href;
                    if (!result.toLowerCase().endsWith('.pdf')) {
                        hrefArray.push(result);
                    } else {
                        pdfUrlsArray.push(result);
                    }
                }
            });

            // Handle PDF URLs
            if (pdfUrlsArray.length > 0) {
                const folderPath = path.join(__dirname, 'convertedPdfUrls', _substanceCD);
                fs.mkdirSync(folderPath, { recursive: true });
                const downloadPromises = pdfUrlsArray.map(async (url) => {
                const fileName = path.basename(url);
                const filePath = path.join(folderPath, fileName);
                    try {
                        const response = await axios.get(url, { responseType: 'stream' });
                        const file = fs.createWriteStream(filePath);
                        response.data.pipe(file);
                        return new Promise((resolve, reject) => {
                            file.on('finish', () => {
                                file.close(async () => {
                                    // console.log(`Download completed: ${filePath}`);
                                    let relativePath = path.relative(__dirname, filePath);
                                    let insertedData = {
                                        pysicalPath: relativePath.replace(/\\/g, '/'),
                                        url: url,
                                        UrlStatus: response.status,
                                        UrlError: '',
                                        substanceCD: _substanceCD
                                    };
                                    totalResponseData.push(insertedData)
                                    // await Pdfurls.insertMany(insertedData)
                                    resolve();
                                });
                            });

                            file.on('error', async (err) => {
                                fs.unlink(filePath, () => reject(err));
                                let relativePath = path.relative(__dirname, filePath);
                                let insertedData = {
                                    pysicalPath: relativePath.replace(/\\/g, '/'),
                                    url: url,
                                    UrlStatus: "",
                                    UrlError: err.message,
                                    substanceCD: _substanceCD
                                };
                                totalResponseData.push(insertedData)
                                // await Pdfurls.insertMany(insertedData)

                            });
                        });
                    } catch (err) {
                        console.log(`Error downloading ${url}:`, err);

                    }
                });

                await Promise.all(downloadPromises);
            }

            // Handle non-PDF URLs
            if (hrefArray.length > 0) {
                try {
                    let index2 = 0;
                    const folderPath = path.join(__dirname, 'convertedPdfUrls', _substanceCD);
                    fs.mkdirSync(folderPath, { recursive: true });

                    while (hrefArray.length > index2) {
                        await startBrowerEngine();
                        let pdfPath = path.join(folderPath, `${_substanceCD}_${index2}.pdf`);
                        let getBse64 = await genPdf(hrefArray[index2], pdfPath);
                        let relativePath = path.relative(__dirname, pdfPath);
                        let insertedData = {
                            pysicalPath: relativePath.replace(/\\/g, '/'),
                            url: hrefArray[index2],
                            UrlStatus: getBse64.status,
                            UrlError: getBse64.error ? getBse64.error : "",
                            substanceCD: _substanceCD
                        };
                        totalResponseData.push(insertedData)
                        // await Pdfurls.insertMany(insertedData)
                        index2++;
                    }
                } catch (error) {
                    console.log("Error:", error);
                }
            }

            hrefArray = [];
            pdfUrlsArray = [];
        }
        return res.status(200).json({ success: true, status: 200, desc: '', data: totalResponseData })


    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
