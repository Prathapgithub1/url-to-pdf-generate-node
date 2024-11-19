const express = require('express');
const mongoose = require('mongoose');
const cheerio = require('cheerio')
const fs = require('fs');
const axios = require("axios");
const path = require('path');
const app = express();
const PORT = 3000;
const puppeteer = require('puppeteer');


// Middleware to parse incoming JSON data
app.use(express.json());

// MongoDB connection URI
const mongoURI = 'mongodb://localhost:27017/monography';

// MongoDB connection setup
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the Mongoose schema and model
//pdfAndUrl schema

let _pdf_Url = new mongoose.Schema({
    "_id": {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true,
    },
    pysicalPath: {
        type: String
    },
    url: {
        type: String
    },
    UrlStatus: {
        type: String
    },
    UrlError: {
        type: String
    },
    substanceCD: {
        type: String
    }
})

//section Data
const _sectionsData = new mongoose.Schema([
    {
        "_id": {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            auto: true,
        },
        drug_monography_Code: {
            type: String
        },
        drug_monography_description: {
            type: String
        },
        drugId: {
            type: String,
            //  required:true
        },
        type: {
            type: String
        },
        INT_ID: {
            type: Number
        },
        operation_type: {
            type: String
        },
        PARENT_DRUG_ID: {
            type: String
        },
        DD_SUBSTANCE_CD: {
            type: String
        },
        SECTION_TYPE: {
            type: String
        },
        SECTION_NAME: {
            type: String
        },
        drug_code: {
            type: String
        },
        drug_section_id: {
            type: String,
            required: true
        },
        user_id: {
            type: String,
            required: true
        },
        userName: {
            type: String
        },
        role_id: {
            type: String,
            required: true
        },
        roleName: {
            type: String
        },
        drug_content: {
            type: String
        },
        content_type: {
            type: String,
            required: true
        },
        // interacaction_drug_content:[{
        //     any: mongoose.Schema.Types.Mixed
        // }],
        interacaction_drug_content: [{
            "_id": {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                auto: true,
            },
            DRUG_IN_PARENT_ID: {
                type: Number
            },
            SRC_DRUG_CD: {
                type: String
            },
            DD_SUBSTANCE_NAME: {
                type: String
            },
            ROA_CD: {
                type: String
            },
            ROA_NAME: {
                type: String
            },
            INT_TYPE_ID: {
                type: String
            },
            ENTITY_VALUE_NAME: {
                type: String
            },
            INT_ID: {
                type: Number
            },
            ENTITY_NAME: {
                type: String
            },
            SEVERITY_ID: {
                type: Number
            },
            SEVERITY_NAME: {
                type: String
            },
            SRC_ID: {
                type: Number
            },
            SRC_NAME: {
                type: String
            },
            SRC_DESC: {
                type: String
            },
            SRC_URL: {
                type: String
            },
            INTERACTIONS: {
                type: String
            },
            REFERENCES: {
                type: String
            },
            STATUS: {
                type: String
            }
        }],
        section_comment: [
            {
                "_id": {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    auto: true,
                },
                comment_desc: {
                    type: String
                },
                profilePic: {
                    type: String
                },
                date: {
                    type: String
                },
                userName: {
                    type: String
                },
                roleName: {
                    type: String
                }
            }
        ],
        current_status: {
            type: String
        },
        current_status_id: {
            type: String
        },
        next_status: {
            type: String
        },
        next_status_id: {
            type: String
        },
        recStatus: {
            type: Boolean,
            default: true
        },
        session_id: {
            type: String
        },
        revNo: {
            type: Number,
            required: true,
            default: () => { return 1 }
        },
        audit: {
            "_id": {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                auto: true,
            },
            documentedById: String,
            documentedBy: String,
            documentedDt: {
                type: String,
                default: () => { return new Date().toISOString() },
            },
            modifiedById: String,
            modifiedBy: String,
            modifiedDt: {
                type: String
            }
        },
        history: [
            {
                "_id": {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    auto: true,
                },
                revTranId: {
                    type: String
                },
                revNo: {
                    type: Number
                }
            }
        ]
    }
]);
const Pdfurls = mongoose.model('pdfUrl', _pdf_Url);
const Sections = mongoose.model('sections', _sectionsData);


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
    //  console.log(browser)
    // {
    //     headless: true, ignoreHTTPSErrors: true,
    //     args: ['--proxy-server="direct://"', '--proxy-bypass-list=*']
    // }

    // browser = await puppeteer.launch({
    //     args: ['--no-sandbox'],
    //     headless: true,
    //     ignoreHTTPSErrors: true,
    //     timeout: 0
    // });
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
            // margin: {
            //     top: "20px",
            //     right: "30px",
            //     bottom: "20px",
            //     left: "30px"
            // }
        });
        // await __page.waitFor(2000);
        // await delay(1000);
        // let _bufValue = "";
        // _bufValue = await __page.pdf({ path: "output.pdf", format: 'A4'});
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
        // Filter the data
        let _filter =[{$match:{ "recStatus": true, "SECTION_NAME": { $regex: "referen", $options: "i" } }}]
        // To get the data from our DB
        let _mRespData = await Sections.aggregate(_filter)
        _mRespData["data"]=_mRespData
        if(_mRespData.data.length>0){
            let hrefArray = [];
            let pdfUrlsArray = [];
            let outerIndex = 0;
            while (_mRespData.data.length > outerIndex) {
                let _htmlTags = _mRespData.data[outerIndex].drug_content;
                let _substanceCD = _mRespData.data[outerIndex].DD_SUBSTANCE_CD;
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
                                            await Pdfurls.insertMany(insertedData)
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
                                        await Pdfurls.insertMany(insertedData)

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
                                let startBrowser = await startBrowerEngine();
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
                                await Pdfurls.insertMany(insertedData)
                                index2++;
                            }
                        } catch (error) {
                            console.log("Error:", error);
                        }
                    }
    
                    hrefArray = [];
                    pdfUrlsArray = [];
                }
                console.log("looping number:", outerIndex)
                outerIndex++;
            }
    
            res.status(200).send("Process completed");
        }
     
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
