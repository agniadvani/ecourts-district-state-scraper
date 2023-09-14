const puppeteer = require("puppeteer")
const Captcha = require("2captcha")
const fs = require("fs")

async function scrapeStatesAndDistricts() {
    try {
        let result = []
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: false,
        });

        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

        // Goto Page 
        await page.goto("https://services.ecourts.gov.in/ecourtindia_v6/")

        // Wait for case status section button and click on it
        // await page.waitForSelector("#leftPaneMenuCS")
        await page.click("#leftPaneMenuCS")
        if ((await page.$(".alert.alert-danger")) !== null) {
            await page.click("#msg-danger > a")
            console.log("Page error bypassed...")
        }

        await sleep(3500)

        if (await page.$("#validateError > div > div > div.modal-header.text-center.align-items-start > button") !== null) {
            // await page.click("div.modal-header.text-center.align-items-start > button", { delay: 500 })
            await page.click("div.modal-header.text-center.align-items-start > button")
            console.log("Close button clicked...")
        }

        await page.waitForSelector("div:nth-child(5) > div.col-md-auto > button", { visible: true })
        console.log("Go Button loaded")

        await sleep(4000)
        const statesArray = await page.evaluate(() =>
            Array.from(document.querySelectorAll('#sess_state_code option')).map(element => {
                if (element.value !== '0') {
                    return { value: element.value, state: element.textContent }
                }
            })
        );

        for (let i = 0; i < statesArray.length; i++) {
            const state = statesArray[i]
            await sleep(900)
            if (state !== null) {
                console.log(state)
                console.log("Current State:", state.state)
                await page.select("#sess_state_code", state.value)
                result[i] = { state: state.state, value: state.value, district: new Array() }

                await sleep(900)
                const districtArray = await page.evaluate(() =>
                    Array.from(document.querySelectorAll('#sess_dist_code option')).map(element => {
                        if (element.value) {
                            return { value: element.value, district: element.textContent }
                        }
                    })
                );

                for (let j = 0; j < districtArray.length; j++) {

                    const district = districtArray[j]
                    if (!district) {
                        continue
                    }
                    console.log("Current District:", district.district)
                    await sleep(900)
                    await page.select("#sess_dist_code", district.value)
                    await sleep(900)
                    result[i].district[j] = { district: district.district, value: district.value, courtComplex: new Array() }

                    const courtComplexArray = await page.evaluate(() =>
                        Array.from(document.querySelectorAll('#court_complex_code option')).map(element => {
                            if (element.value) {
                                return { value: element.value, courtComplex: element.textContent }
                            }
                        })
                    );


                    for (let k = 0; k < courtComplexArray.length; k++) {
                        const courtComplex = courtComplexArray[k]
                        if (!courtComplex) {
                            continue
                        }
                        console.log("Current CourtComplex:", courtComplex.courtComplex)
                        await sleep(900)
                        await page.select("#court_complex_code", courtComplex.value)
                        await sleep(900)
                        result[i].district[j].courtComplex[k] = { courtComplex: courtComplex.courtComplex, value: courtComplex.value, court: new Array() }
                        const courtArray = await page.evaluate(() =>

                            Array.from(document.querySelectorAll('#court_est_code option')).map(element => {
                                if (element.value !== '0') {
                                    return { value: element.value, court: element.textContent }
                                }
                            })
                        );
                        for (let l = 0; l < courtArray.length; l++) {
                            const court = courtArray[l]
                            if (!court) {
                                continue
                            }
                            console.log("Current court:", court.court)
                            await sleep(900)
                            await page.select("#court_est_code", court.value)
                            result[i].district[j].courtComplex[k].court[l] = { court: court.court, value: court.value }
                        }

                    }
                }
            }

            console.log(result)
        }

        fs.writeFileSync("./data/result.json", JSON.stringify(result))
    } catch (err) {
        console.log(err)
    }




}


scrapeStatesAndDistricts()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


